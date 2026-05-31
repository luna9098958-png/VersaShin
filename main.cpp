#include <iostream>
#include "genesis_kernel.h"

int main() {
    KeyPair keys;
    std::cout << "[SYSTEM CLUSTER STATUS] SINCRO_MAESTRA_OK: " << SINCRO_MAESTRA_OK << std::endl;
    std::cout << "[SECURITY VERIFICATION] USER_ID: " << keys.user_id << std::endl;
    std::cout << "[INTEGRITY DECK] HASH: " << keys.integrity_hash << std::endl;
    std::cout << "[MASTER SYNC STATUS] COMPLETA: " << (keys.sincro_maestra_completa ? "TRUE" : "FALSE") << std::endl;
    std::cout << "[SECURITY LEVEL] PRIME: 0x" << std::hex << keys.security_level << std::endl;
    return 0;
}
