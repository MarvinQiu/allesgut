package com.allesgut.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentMentionId implements Serializable {
    private UUID commentId;
    private UUID userId;
}
