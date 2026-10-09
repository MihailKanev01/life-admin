package com.lifeadmin.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LifeAdminApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(LifeAdminApiApplication.class, args);
    }
}
