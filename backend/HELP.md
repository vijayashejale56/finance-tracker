# Getting Started

### Reference Documentation

For further reference, please consider the following sections:

- [Official Apache Maven documentation](https://maven.apache.org/guides/index.html)
- [Spring Boot Maven Plugin Reference Guide](https://docs.spring.io/spring-boot/4.0.6/maven-plugin)
- [Create an OCI image](https://docs.spring.io/spring-boot/4.0.6/maven-plugin/build-image.html)
- [Spring Web](https://docs.spring.io/spring-boot/4.0.6/reference/web/servlet.html)
- [Spring Data JPA](https://docs.spring.io/spring-boot/4.0.6/reference/data/sql.html#data.sql.jpa-and-spring-data)
- [Spring Security](https://docs.spring.io/spring-boot/4.0.6/reference/web/spring-security.html)
- [Validation](https://docs.spring.io/spring-boot/4.0.6/reference/io/validation.html)

### Guides

The following guides illustrate how to use some features concretely:

- [Building a RESTful Web Service](https://spring.io/guides/gs/rest-service/)
- [Serving Web Content with Spring MVC](https://spring.io/guides/gs/serving-web-content/)
- [Building REST services with Spring](https://spring.io/guides/tutorials/rest/)
- [Accessing Data with JPA](https://spring.io/guides/gs/accessing-data-jpa/)
- [Securing a Web Application](https://spring.io/guides/gs/securing-web/)
- [Spring Boot and OAuth2](https://spring.io/guides/tutorials/spring-boot-oauth2/)
- [Authenticating a User with LDAP](https://spring.io/guides/gs/authenticating-ldap/)
- [Validation](https://spring.io/guides/gs/validating-form-input/)

### Maven Parent overrides

Due to Maven's design, elements are inherited from the parent POM to the project POM.
While most of the inheritance is fine, it also inherits unwanted elements like `<license>` and `<developers>` from the parent.
To prevent this, the project POM contains empty overrides for these elements.
If you manually switch to a different parent and actually want the inheritance, you need to remove those overrides.

Every single new feature follows this exact same pattern. Always. No exceptions.

Step 1 → Add SQL migration if new table needed
Step 2 → Create/update Entity Java class
Step 3 → Create/update Repository interface
Step 4 → Create Request + Response DTOs
Step 5 → Write business logic in Service
Step 6 → Expose it in Controller
Step 7 → Add API function in frontend api/ folder
Step 8 → Build the UI page in features/ folder
Step 9 → Add route in App.tsx

Once you understand this pattern, you can build ANY feature. Budgets, goals, bill reminders, recurring transactions — all follow the same 9 steps.
