package com.financetracker.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends AppException {
    public ResourceNotFoundException(String resource, String id) {
        super(
            resource + " not found with id: " + id,
            HttpStatus.NOT_FOUND,
            resource.toUpperCase() + "_NOT_FOUND"
        );
    }
}
