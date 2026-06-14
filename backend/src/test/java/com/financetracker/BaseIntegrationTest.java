package com.financetracker;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest(
    classes = FinanceTrackerApplication.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
@ActiveProfiles("test")
@TestPropertySource(
    locations = "classpath:application-test.properties"
)
public abstract class BaseIntegrationTest {
}
// package com.financetracker;

// import org.springframework.boot.test.context.SpringBootTest;
// import org.springframework.test.context.ActiveProfiles;

// @SpringBootTest(classes = FinanceTrackerApplication.class)
// @ActiveProfiles("test")
// public abstract class BaseIntegrationTest {
//     // All integration tests extend this
// }