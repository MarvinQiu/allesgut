package com.allesgut.repository;

import com.allesgut.entity.SmsVerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SmsVerificationCodeRepository extends JpaRepository<SmsVerificationCode, Long> {
    Optional<SmsVerificationCode> findTopByPhoneAndCodeOrderByCreatedAtDesc(String phone, String code);
}
