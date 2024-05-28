#include <napi.h>
#include <openssl/evp.h>
#include <string>
#include <vector>

class AESWrapper : public Napi::ObjectWrap<AESWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(env, "AESWrapper", {
            InstanceMethod("encrypt", &AESWrapper::Encrypt),
            InstanceMethod("decrypt", &AESWrapper::Decrypt)
        });

        constructor = Napi::Persistent(func);
        constructor.SuppressDestruct();
        exports.Set("AESWrapper", func);
        return exports;
    }

    AESWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<AESWrapper>(info)  {
        Napi::Env env = info.Env();
        Napi::HandleScope scope(env);

        std::string key = info[0].As<Napi::String>().Utf8Value();
        key_ = key;

        encrypt_ctx_ = EVP_CIPHER_CTX_new();
        decrypt_ctx_ = EVP_CIPHER_CTX_new();

        EVP_EncryptInit_ex(encrypt_ctx_, EVP_aes_128_ecb(), NULL, reinterpret_cast<const unsigned char*>(key_.data()), NULL);
        EVP_DecryptInit_ex(decrypt_ctx_, EVP_aes_128_ecb(), NULL, reinterpret_cast<const unsigned char*>(key_.data()), NULL);
    }

    ~AESWrapper() {
        EVP_CIPHER_CTX_free(encrypt_ctx_);
        EVP_CIPHER_CTX_free(decrypt_ctx_);
    }

private:
    static Napi::FunctionReference constructor;

    std::string key_;
    EVP_CIPHER_CTX *encrypt_ctx_;
    EVP_CIPHER_CTX *decrypt_ctx_;

    Napi::Value Encrypt(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        Napi::HandleScope scope(env);

        std::string plainText = info[0].As<Napi::String>().Utf8Value();
        std::vector<unsigned char> encryptedText(plainText.size() + EVP_CIPHER_block_size(EVP_aes_128_ecb()));

        int len;
        EVP_EncryptInit_ex(encrypt_ctx_, NULL, NULL, NULL, NULL);
        EVP_EncryptUpdate(encrypt_ctx_, encryptedText.data(), &len, reinterpret_cast<const unsigned char*>(plainText.data()), plainText.size());
        int ciphertext_len = len;
        EVP_EncryptFinal_ex(encrypt_ctx_, encryptedText.data() + len, &len);
        ciphertext_len += len;

        return Napi::String::New(env, std::string(encryptedText.begin(), encryptedText.begin() + ciphertext_len));
    }

    Napi::Value Decrypt(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        Napi::HandleScope scope(env);

        std::string cipherText = info[0].As<Napi::String>().Utf8Value();
        std::vector<unsigned char> decryptedText(cipherText.size());

        int len;
        EVP_DecryptInit_ex(decrypt_ctx_, NULL, NULL, NULL, NULL);
        EVP_DecryptUpdate(decrypt_ctx_, decryptedText.data(), &len, reinterpret_cast<const unsigned char*>(cipherText.data()), cipherText.size());
        int plaintext_len = len;
        EVP_DecryptFinal_ex(decrypt_ctx_, decryptedText.data() + len, &len);
        plaintext_len += len;

        return Napi::String::New(env, std::string(decryptedText.begin(), decryptedText.begin() + plaintext_len));
    }
};

Napi::FunctionReference AESWrapper::constructor;

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    return AESWrapper::Init(env, exports);
}

NODE_API_MODULE(aes, Init)
