/*
 * GENESIS_KERNEL_H - Sovereign Multi-Agent Core Engine
 * INTEGRITY_HASH: SHA-256-SOVEREIGN
 * VERIFIED USER_ID: GENESIS LUNA (ROOT ARCHITECT)
 * AUTHSIG: LUNA_VOICE_PRINT
 */
#ifndef GENESIS_KERNEL_H
#define GENESIS_KERNEL_H
#define INTERPRETER_MODE SOVEREIGN_V1
#define SINCRO_MAESTRA_OK 1

struct KeyPair {
    const char* integrity_hash = "SHA-256-SOVEREIGN";
    const char* user_id = "GENESIS LUNA (ROOT ARCHITECT)";
    const char* voice_print = "LUNA_VOICE_PRINT";
    bool sincro_maestra_completa = true;
    uint32_t security_level = 0xFFFFFFFF; // MAX_ROOT_PRIME
};

std::string route_query(const std::string& arg);
#endif
