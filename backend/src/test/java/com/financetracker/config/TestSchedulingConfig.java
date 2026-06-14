package com.financetracker.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@Profile("!test")
@EnableScheduling
public class TestSchedulingConfig {
    // Scheduling disabled in test profile
}

// package com.financetracker.config;

// import org.springframework.context.annotation.Configuration;
// import org.springframework.context.annotation.Profile;
// import org.springframework.scheduling.annotation.EnableScheduling;

// @Configuration
// @Profile("!test")
// @EnableScheduling
// public class TestSchedulingConfig {
//     // Scheduling only enabled when NOT in test profile
// }

