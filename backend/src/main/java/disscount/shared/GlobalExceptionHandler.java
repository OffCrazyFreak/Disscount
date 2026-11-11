package disscount.shared;

import jakarta.validation.ConstraintViolation;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.transaction.TransactionSystemException;
import org.springframework.validation.FieldError;
import org.springframework.web.ErrorResponse;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.sql.SQLException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Stream;

/** Codes not in the bundle are shown as written, so a missing code degrades to its own text, not a blank. */
@RestControllerAdvice
class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final MessageSource messageSource;

    public GlobalExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    @ExceptionHandler(BadRequestException.class)
    public ProblemDetail handleBadRequestException(BadRequestException ex) {
        return problem(HttpStatus.BAD_REQUEST, "bad-request", message(ex.getMessage(), ex.getArgs()));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ProblemDetail handleUnauthorizedException(UnauthorizedException ex) {
        return problem(HttpStatus.UNAUTHORIZED, "unauthorized", message(ex.getMessage()));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ProblemDetail handleForbiddenException(ForbiddenException ex) {
        return problem(HttpStatus.FORBIDDEN, "forbidden", message(ex.getMessage()));
    }

    /** A method security denial; without it the catch-all below would answer a logged 500. */
    @ExceptionHandler(AuthorizationDeniedException.class)
    public ProblemDetail handleAuthorizationDenied(AuthorizationDeniedException ex) {
        return problem(HttpStatus.FORBIDDEN, "forbidden", message("problem.detail.forbidden"));
    }

    @ExceptionHandler(NotFoundException.class)
    public ProblemDetail handleNotFoundException(NotFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, "not-found", message(ex.getMessage()));
    }

    @Override
    protected ResponseEntity<Object> handleNoResourceFoundException(
            NoResourceFoundException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        return respond(ex, problem(HttpStatus.NOT_FOUND, "not-found", message("problem.title.not-found")),
                headers, status, request);
    }

    /** The headers Spring passes in carry the Allow list RFC 9110 requires on a 405. */
    @Override
    protected ResponseEntity<Object> handleHttpRequestMethodNotSupported(
            HttpRequestMethodNotSupportedException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        ProblemDetail detail = problem(HttpStatus.METHOD_NOT_ALLOWED, "method-not-allowed",
                message("problem.detail.method-not-allowed", ex.getMethod()));
        return respond(ex, detail, headers, status, request);
    }

    @ExceptionHandler(ConflictException.class)
    public ProblemDetail handleConflictException(ConflictException ex) {
        ProblemDetail detail = problem(HttpStatus.CONFLICT, "conflict", message(ex.getMessage()));
        // The detail is translated, so clients that branch on a conflict read the code instead.
        detail.setProperty("code", ex.getMessage());
        return detail;
    }

    @ExceptionHandler(ServiceUnavailableException.class)
    public ProblemDetail handleServiceUnavailable(ServiceUnavailableException ex) {
        ProblemDetail detail = problem(HttpStatus.SERVICE_UNAVAILABLE, "unavailable", message(ex.getMessage()));
        // Clients tell a switched off feature from a passing outage by the code, since the detail is translated.
        detail.setProperty("code", ex.getMessage());
        return detail;
    }

    @ExceptionHandler(TooManyRequestsException.class)
    public ResponseEntity<ProblemDetail> handleTooManyRequests(TooManyRequestsException ex) {
        ProblemDetail detail = problem(HttpStatus.TOO_MANY_REQUESTS, "too-many-requests", message(ex.getMessage()));
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header(HttpHeaders.RETRY_AFTER, String.valueOf(ex.getRetryAfterSeconds()))
                .body(detail);
    }

    @Override
    protected ResponseEntity<Object> handleMaxUploadSizeExceededException(
            MaxUploadSizeExceededException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        ProblemDetail detail = problem(HttpStatus.CONTENT_TOO_LARGE, "payload-too-large",
                message("error.cardPhoto.tooLarge", String.valueOf(PhotoValidator.MAX_BYTES / 1024)));
        return respond(ex, detail, headers, status, request);
    }

    @Override
    protected ResponseEntity<Object> handleMissingServletRequestPart(
            MissingServletRequestPartException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        ProblemDetail detail = problem(HttpStatus.BAD_REQUEST, "bad-request",
                message("problem.detail.missing-part", ex.getRequestPartName()));
        return respond(ex, detail, headers, status, request);
    }

    /** A unique violation also comes as DataIntegrityViolationException; never log driver text, it holds the value. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDuplicateKey(DataIntegrityViolationException ex) {
        // Rethrowing would bypass this advice and surface a container 500, so the non-conflict case is answered here.
        if (!(ex instanceof DuplicateKeyException) && !isUniqueViolation(ex)) {
            return handleGenericException(ex);
        }

        String constraint = constraintNameOf(ex);
        log.warn("Duplicate key violation on constraint: {}", constraint);

        boolean isUsername = constraint.toLowerCase().contains("username");

        String text = message(isUsername ? "error.user.usernameTaken" : "problem.detail.duplicate-value");
        ProblemDetail detail = problem(HttpStatus.CONFLICT, "conflict", text);

        if (isUsername) {
            detail.setProperty("fieldErrors", Map.of("username", text));
        }

        return detail;
    }

    /** SQLState 23505 is unique_violation in both PostgreSQL and the H2 the tests run on. */
    private static boolean isUniqueViolation(Throwable ex) {
        return causeChain(ex).anyMatch(cause -> cause instanceof SQLException sql && "23505".equals(sql.getSQLState()));
    }

    private static Stream<Throwable> causeChain(Throwable ex) {
        return Stream.iterate(ex, Objects::nonNull, cause -> cause.getCause() == cause ? null : cause.getCause());
    }

    /** The constraint name only; the message around it carries the colliding value. */
    private static String constraintNameOf(DataIntegrityViolationException ex) {
        Throwable cause = ex.getCause();
        if (cause instanceof ConstraintViolationException violation
                && violation.getConstraintName() != null) {
            return violation.getConstraintName();
        }
        return ex.getClass().getSimpleName();
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String key = (error instanceof FieldError fieldError)
                    ? fieldError.getField()
                    : error.getObjectName();
            fieldErrors.put(key, error.getDefaultMessage());
        });

        return respond(ex, validationProblem(fieldErrors), headers, status, request);
    }

    /** Covers @Validated params and Hibernate entity constraints, wrapped in TransactionSystemException on commit. */
    @ExceptionHandler({jakarta.validation.ConstraintViolationException.class, TransactionSystemException.class})
    public ProblemDetail handleEntityValidation(Exception ex) {
        jakarta.validation.ConstraintViolationException violations = entityViolationsOf(ex);
        if (violations == null) {
            return handleGenericException(ex);
        }

        Map<String, String> fieldErrors = new HashMap<>();
        for (ConstraintViolation<?> violation : violations.getConstraintViolations()) {
            fieldErrors.put(violation.getPropertyPath().toString(), violationMessage(violation));
        }
        log.warn("Entity validation failed on fields: {}", fieldErrors.keySet());

        return validationProblem(fieldErrors);
    }

    private ProblemDetail validationProblem(Map<String, String> fieldErrors) {
        ProblemDetail problemDetail =
                problem(HttpStatus.BAD_REQUEST, "validation", message("problem.detail.validation"));
        problemDetail.setProperty("fieldErrors", fieldErrors);
        return problemDetail;
    }

    private static jakarta.validation.ConstraintViolationException entityViolationsOf(Throwable ex) {
        return causeChain(ex)
                .filter(jakarta.validation.ConstraintViolationException.class::isInstance)
                .map(jakarta.validation.ConstraintViolationException.class::cast)
                .findFirst().orElse(null);
    }

    /** Hibernate's validator factory does not read our bundles, so its "{validation.x}" template resolves here. */
    private String violationMessage(ConstraintViolation<?> violation) {
        String template = violation.getMessageTemplate();
        boolean unresolved = template.equals(violation.getMessage());
        if (unresolved && template.startsWith("{validation.") && template.endsWith("}")) {
            String code = template.substring(1, template.length() - 1);
            return messageSource.getMessage(
                    code, null, violation.getMessage(), LocaleContextHolder.getLocale());
        }
        return violation.getMessage();
    }

    /** Without this a malformed UUID is a logged 500, free for anyone to trigger. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return problem(HttpStatus.BAD_REQUEST, "bad-request",
                message("problem.detail.type-mismatch", ex.getName()));
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        ProblemDetail detail = problem(HttpStatus.BAD_REQUEST, "malformed-request",
                message("problem.detail.malformed-request"));
        return respond(ex, detail, headers, status, request);
    }

    /** Spring's localised detail is kept; only type and title are set to ours. */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(
            Exception ex, Object body, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        if (status.is5xxServerError()) {
            log.error("Unhandled exception caught", ex);
        }
        // A server-side detail may describe internals, so a 5xx always gets the generic text.
        String springDetail = !status.is5xxServerError() && ex instanceof ErrorResponse errorResponse
                ? errorResponse.updateAndGetBody(messageSource, LocaleContextHolder.getLocale()).getDetail()
                : null;
        String detailText = springDetail != null ? springDetail : message("problem.detail.internal-error");
        String type = typeFor(status);
        ProblemDetail detail = problem(status, type, detailText);
        return respond(ex, detail, headers, status, request);
    }

    private static String typeFor(HttpStatusCode status) {
        return switch (status.value()) {
            case 401 -> "unauthorized";
            case 403 -> "forbidden";
            case 404 -> "not-found";
            case 405 -> "method-not-allowed";
            case 409 -> "conflict";
            case 413 -> "payload-too-large";
            case 415 -> "unsupported-media-type";
            case 429 -> "too-many-requests";
            case 503 -> "unavailable";
            default -> status.is5xxServerError() ? "internal-error" : "bad-request";
        };
    }

    private ResponseEntity<Object> respond(
            Exception ex, ProblemDetail body, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        return super.handleExceptionInternal(ex, body, headers, status, request);
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGenericException(Exception ex) {
        log.error("Unhandled exception caught", ex);
        return problem(HttpStatus.INTERNAL_SERVER_ERROR, "internal-error",
                message("problem.detail.internal-error"));
    }

    private String message(String codeOrText, Object... args) {
        return messageSource.getMessage(codeOrText, args, codeOrText, LocaleContextHolder.getLocale());
    }

    private ProblemDetail problem(HttpStatusCode status, String type, String detail) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(status, detail);
        problemDetail.setType(URI.create("urn:disscount:" + type));
        problemDetail.setTitle(message("problem.title." + type));
        problemDetail.setProperty("timestamp", Instant.now());
        return problemDetail;
    }
}
