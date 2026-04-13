package com.allesgut.service;

import com.allesgut.LocalhostSchemaTestBase;
import com.allesgut.dto.response.PageResponse;
import com.allesgut.dto.response.PostPublicDto;
import com.allesgut.entity.Post;
import com.allesgut.entity.User;
import com.allesgut.repository.PostRepository;
import com.allesgut.repository.UserRepository;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class PostFeedPerformanceTests extends LocalhostSchemaTestBase {

    @Autowired
    private PostService postService;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @Test
    @Transactional
    void getFeed_shouldNotExecuteNPlusOneQueries() {
        // Arrange
        int postCount = 20;

        User author = userRepository.save(User.builder()
                .phone(String.format("%011d", Math.floorMod(System.nanoTime(), 100_000_000_000L)))
                .nickname("Perf Author")
                .build());

        for (int i = 0; i < postCount; i++) {
            postRepository.save(Post.builder()
                    .userId(author.getId())
                    .title("Post " + i)
                    .content("Content " + i)
                    .build());
        }

        SessionFactory sessionFactory = entityManagerFactory.unwrap(SessionFactory.class);
        Statistics stats = sessionFactory.getStatistics();
        stats.setStatisticsEnabled(true);
        stats.clear();

        // Act
        PageResponse<PostPublicDto> response = postService.getFeed(
                "latest",
                UUID.randomUUID(),
                0,
                postCount,
                null,
                null
        );

        // Assert
        assertThat(response.getData()).hasSize(postCount);

        long preparedStatements = stats.getPrepareStatementCount();

        // Baseline expectation:
        // 1 query: posts page
        // 1 query: authors (batched)
        // 1 query: likes for (userId, postIds)
        // 1 query: favorites for (userId, postIds)
        // 1 query: follows for (userId, authorIds)
        // 1 query: tags for postIds
        // Plus potentially 1 count query depending on paging implementation.
        // Keep a small buffer for Hibernate internal queries.
        long maxStatements = 30;

        assertThat(preparedStatements)
                .as("Expected query count <= %s but was %s", maxStatements, preparedStatements)
                .isLessThanOrEqualTo(maxStatements);
    }
}
