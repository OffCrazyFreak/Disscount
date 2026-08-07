package disscount.exceptions;

import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * All errors are returned as RFC 9457 Problem Details (application/problem+json).
 * Validation failures additionally carry a "fieldErrors" map (field -> message)
 * that the frontend maps onto react-hook-form field errors.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BadRequestException.class)
    public ProblemDetail handleBadRequestException(BadRequestException ex) {
        return problem(HttpStatus.BAD_REQUEST, "bad-request", "Neispravan zahtjev", ex.getMessage());
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ProblemDetail handleUnauthorizedException(UnauthorizedException ex) {
        return problem(HttpStatus.UNAUTHORIZED, "unauthorized", "Neautorizirano", ex.getMessage());
    }

    @ExceptionHandler(ForbiddenException.class)
    public ProblemDetail handleForbiddenException(ForbiddenException ex) {
        return problem(HttpStatus.FORBIDDEN, "forbidden", "Zabranjeno", ex.getMessage());
    }

    @ExceptionHandler(NotFoundException.class)
    public ProblemDetail handleNotFoundException(NotFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, "not-found", "Nije pronađeno", ex.getMessage());
    }

    @ExceptionHandler(ConflictException.class)
    public ProblemDetail handleConflictException(ConflictException ex) {
        return problem(HttpStatus.CONFLICT, "conflict", "Sukob", ex.getMessage());
    }

    /**
     * Duplicate keys only. Not-null, check and foreign-key violations are bugs, not
     * conflicts, and fall through to the 500. Nothing from the driver message is logged:
     * PostgreSQL puts the colliding value in it.
     */
    @ExceptionHandler(DuplicateKeyException.class)
    public ProblemDetail handleDuplicateKey(DuplicateKeyException ex) {
        String constraint = constraintNameOf(ex);
        log.warn("Duplicate key violation on constraint: {}", constraint);

        boolean isUsername = constraint.toLowerCase().contains("username");

        ProblemDetail detail = problem(HttpStatus.CONFLICT, "conflict", "Sukob",
                isUsername ? "Korisničko ime je već zauzeto." : "Vrijednost je već zauzeta.");

        if (isUsername) {
            detail.setProperty("fieldErrors", Map.of("username", "Korisničko ime je već zauzeto."));
        }

        return detail;
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
                problem(HttpStatus.BAD_REQUEST, "validation", "Neispravni podaci", "Invalid input data");
        problemDetail.setProperty("fieldErrors", fieldErrors);
        return problemDetail;
    }

    /** Without this a malformed UUID is a logged 500, free for anyone to trigger. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return problem(HttpStatus.BAD_REQUEST, "bad-request", "Neispravan zahtjev",
                "Neispravan format parametra: " + ex.getName());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleNotReadable(HttpMessageNotReadableException ex) {
        return problem(HttpStatus.BAD_REQUEST, "malformed-request", "Neispravan zahtjev",
                "Malformed request body");
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGenericException(Exception ex) {
        log.error("Unhandled exception caught", ex);
        return problem(HttpStatus.INTERNAL_SERVER_ERROR, "internal-error",
                "Greška na poslužitelju", "An unexpected error occurred");
    }

    private ProblemDetail problem(HttpStatus status, String type, String title, String detail) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(status, detail);
        problemDetail.setType(URI.create("urn:disscount:" + type));
        problemDetail.setTitle(title);
        problemDetail.setProperty("timestamp", Instant.now());
        return problemDetail;
    }
}
