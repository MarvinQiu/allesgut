package com.allesgut.repository;

import com.allesgut.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
class UserRepositoryTests {

    @Autowired
    private UserRepository userRepository;

    @Test
    void shouldSaveAndFindUserByPhone() {
        // Given
        User user = User.builder()
                .phone("13800138000")
                .nickname("Test User")
                .build();

        // When
        User savedUser = userRepository.save(user);
        Optional<User> foundUser = userRepository.findByPhone("13800138000");

        // Then
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getId()).isEqualTo(savedUser.getId());
        assertThat(foundUser.get().getNickname()).isEqualTo("Test User");
    }

    @Test
    void shouldReturnEmptyWhenPhoneNotFound() {
        // When
        Optional<User> foundUser = userRepository.findByPhone("99999999999");

        // Then
        assertThat(foundUser).isEmpty();
    }
}
