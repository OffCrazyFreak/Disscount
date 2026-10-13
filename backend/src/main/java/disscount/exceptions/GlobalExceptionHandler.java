package disscount.exceptions;

import jakarta.validation.ConstraintViolation;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.sql.SQLException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * All errors are returned as RFC 9457 Problem Details (application/problem+json).
 * Validation failures additionally carry a "fieldErrors" map (field -> message)
 * that the frontend maps onto react-hook-form field errors.
 *
 * <p>Titles and details are message codes resolved against messages*.properties in the
 * request's Accept-Language. An exception message that is not a known code is shown as
 * written, so a code missing from the bundle degrades to its own text, not to a blank.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final MessageSource messageSource;

    public GlobalExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    @ExceptionHandler(BadRequestException.class)
    public ProblemDetail handleBadRequestException(BadRequestException ex) {
        return problem(HttpStatus.BAD_REQUEST, "bad-request", message(ex.getMessage()));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ProblemDetail handleUnauthorizedException(UnauthorizedException ex) {
        return problem(HttpStatus.UNAUTHORIZED, "unauthorized", message(ex.getMessage()));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ProblemDetail handleForbiddenException(ForbiddenException ex) {
        return problem(HttpStatus.FORBIDDEN, "forbidden", message(ex.getMessage()));
    }

    @ExceptionHandler(NotFoundException.class)
    public ProblemDetail handleNotFoundException(NotFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, "not-found", message(ex.getMessage()));
    }

    @ExceptionHandler(ConflictException.class)
    public ProblemDetail handleConflictException(ConflictException ex) {
        return problem(HttpStatus.CONFLICT, "conflict", message(ex.getMessage()));
    }

    @ExceptionHandler(ServiceUnavailableException.class)
    public ProblemDetail handleServiceUnavailable(ServiceUnavailableException ex) {
        return problem(HttpStatus.SERVICE_UNAVAILABLE, "unavailable", "Usluga nije dostupna", ex.getMessage());
    }

    @ExceptionHandler(TooManyRequestsException.class)
    public ResponseEntity<ProblemDetail> handleTooManyRequests(TooManyRequestsException ex) {
        ProblemDetail detail = problem(HttpStatus.TOO_MANY_REQUESTS, "too-many-requests",
                "Previše zahtjeva", ex.getMessage());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header(HttpHeaders.RETRY_AFTER, String.valueOf(ex.getRetryAfterSeconds()))
                .body(detail);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ProblemDetail handleUploadTooLarge(MaxUploadSizeExceededException ex) {
        return problem(HttpStatus.PAYLOAD_TOO_LARGE, "payload-too-large", "Datoteka je prevelika",
                "Slika je prevelika (najviše 512 KB)");
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ProblemDetail handleMissingPart(MissingServletRequestPartException ex) {
        return problem(HttpStatus.BAD_REQUEST, "bad-request", "Neispravan zahtjev",
                "Nedostaje dio zahtjeva: " + ex.getRequestPartName());
    }

    /**
     * Hibernate reports a unique-index violation as DataIntegrityViolationException, not
     * DuplicateKeyException, so both are caught and narrowed here. Not-null, check and
     * foreign-key violations are bugs rather than conflicts and rethrow to the 500.
     * Nothing from the driver message is logged: PostgreSQL puts the colliding value in it.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDuplicateKey(DataIntegrityViolationException ex) {
        // Rethrowing would bypass this advice entirely and surface a container 500, so the
        // non-conflict case is answered here instead.
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
        for (Throwable cause = ex; cause != null; cause = cause.getCause()) {
            if (cause instanceof SQLException sql && "23505".equals(sql.getSQLState())) {
                return true;
            }
            if (cause.getCause() == cause) {
                break;
            }
        }
        return false;
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

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String key = (error instanceof FieldError fieldError)
                    ? fieldError.getField()
                    : error.getObjectName();
            fieldErrors.put(key, error.getDefaultMessage());
        });

        ProblemDetail problemDetail =
                problem(HttpStatus.BAD_REQUEST, "validation", message("problem.detail.validation"));
        problemDetail.setProperty("fieldErrors", fieldErrors);
        return problemDetail;
    }

    /** Raised by @Validated on a controller for constraints outside a request body, such as a list parameter. */
    @ExceptionHandler(jakarta.validation.ConstraintViolationException.class)
    public ProblemDetail handleConstraintViolation(jakarta.validation.ConstraintViolationException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (ConstraintViolation<?> violation : ex.getConstraintViolations()) {
            fieldErrors.put(violation.getPropertyPath().toString(), violation.getMessage());
        }

        ProblemDetail problemDetail =
                problem(HttpStatus.BAD_REQUEST, "validation", "Neispravni podaci", "Invalid input data");
        problemDetail.setProperty("fieldErrors", fieldErrors);
        return problemDetail;
    }

    /** Without this a malformed UUID is a logged 500, free for anyone to trigger. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return problem(HttpStatus.BAD_REQUEST, "bad-request",
                message("problem.detail.type-mismatch", ex.getName()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleNotReadable(HttpMessageNotReadableException ex) {
        return problem(HttpStatus.BAD_REQUEST, "malformed-request",
                message("problem.detail.malformed-request"));
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

    private ProblemDetail problem(HttpStatus status, String type, String detail) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(status, detail);
        problemDetail.setType(URI.create("urn:disscount:" + type));
        problemDetail.setTitle(message("problem.title." + type));
        problemDetail.setProperty("timestamp", Instant.now());
        return problemDetail;
    }
}
