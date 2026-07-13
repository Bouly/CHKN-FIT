package com.chickenfitness;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ChickenFitnessApplication {

    public static void main(String[] args) {
        SpringApplication.run(ChickenFitnessApplication.class, args);
    }
}
