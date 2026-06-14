package com.financetracker.config;

import com.financetracker.security.RateLimitFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

@Configuration
@RequiredArgsConstructor
public class FilterConfig {

    private final RateLimitFilter rateLimitFilter;

    @Bean
    public FilterRegistrationBean<RateLimitFilter> rateLimitFilterBean() {
        FilterRegistrationBean<RateLimitFilter> registration =
            new FilterRegistrationBean<>();
        registration.setFilter(rateLimitFilter);
        registration.addUrlPatterns("/api/*");
        // Highest precedence — runs before everything including Spring Security
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }
}