package com.allesgut.repository;

import com.allesgut.entity.Post;
import com.allesgut.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
class PostRepositoryTests {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .phone("13800138000")
                .nickname("Test User")
                .build();
        testUser = userRepository.save(testUser);
    }

    @Test
    void shouldSaveAndFindPost() {
        // Given
        Post post = Post.builder()
                .userId(testUser.getId())
                .title("Test Post")
                .content("This is a test post")
                .build();

        // When
        Post savedPost = postRepository.save(post);
        Post foundPost = postRepository.findById(savedPost.getId()).orElse(null);

        // Then
        assertThat(foundPost).isNotNull();
        assertThat(foundPost.getTitle()).isEqualTo("Test Post");
        assertThat(foundPost.getUserId()).isEqualTo(testUser.getId());
    }

    @Test
    void shouldFindPostsByUserId() {
        // Given
        Post post1 = Post.builder()
                .userId(testUser.getId())
                .title("Post 1")
                .content("Content 1")
                .build();
        Post post2 = Post.builder()
                .userId(testUser.getId())
                .title("Post 2")
                .content("Content 2")
                .build();

        postRepository.save(post1);
        postRepository.save(post2);

        // When
        Page<Post> posts = postRepository.findByUserIdOrderByCreatedAtDesc(
                testUser.getId(), PageRequest.of(0, 10));

        // Then
        assertThat(posts.getContent()).hasSizeGreaterThanOrEqualTo(2);
    }
}
