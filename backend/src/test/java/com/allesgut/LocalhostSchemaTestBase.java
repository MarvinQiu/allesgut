package com.allesgut;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.util.UUID;

public abstract class LocalhostSchemaTestBase {

    private static final String DB_URL_BASE = "jdbc:postgresql://localhost:5432/allesgut";
    private static final String DB_USER = System.getProperty("test.db.user", System.getenv().getOrDefault("TEST_DB_USER", "postgres"));
    private static final String DB_PASS = System.getProperty("test.db.pass", System.getenv().getOrDefault("TEST_DB_PASS", ""));

    protected static final String SCHEMA = "test_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);

    private static void executeAdminSql(String sql) {
        try (Connection conn = DriverManager.getConnection(DB_URL_BASE, DB_USER, DB_PASS);
             Statement stmt = conn.createStatement()) {
            stmt.execute(sql);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        executeAdminSql("create schema if not exists " + SCHEMA);

        registry.add("spring.datasource.url", () -> DB_URL_BASE + "?currentSchema=" + SCHEMA);
        registry.add("spring.datasource.username", () -> DB_USER);
        registry.add("spring.datasource.password", () -> DB_PASS);

        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("spring.flyway.enabled", () -> true);

        // Do NOT auto-drop schema on shutdown; it can run before async Spring shutdown completes.
        // Cleanup is manual/periodic: DROP SCHEMA test_xxx CASCADE.
    }
}
