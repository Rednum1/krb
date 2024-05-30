#include <napi.h>
#include <openssl/aes.h>
#include <openssl/rand.h>
#include <openssl/evp.h>
#include <openssl/bio.h>
#include <openssl/buffer.h>
#include <string>
#include <vector>

std::string base64Encode(const unsigned char* buffer, size_t length) {
    BIO *bio, *b64;
    BUF_MEM *bufferPtr;

    b64 = BIO_new(BIO_f_base64());
    bio = BIO_new(BIO_s_mem());
    bio = BIO_push(b64, bio);

    BIO_set_flags(bio, BIO_FLAGS_BASE64_NO_NL);
    BIO_write(bio, buffer, length);
    BIO_flush(bio);
    BIO_get_mem_ptr(bio, &bufferPtr);

    std::string encodedData(bufferPtr->data, bufferPtr->length);
    BIO_free_all(bio);

    return encodedData;
}

std::vector<unsigned char> base64Decode(const std::string &base64String) {
    BIO *bio, *b64;

    int decodeLen = static_cast<int>(base64String.size());
    std::vector<unsigned char> buffer(decodeLen);

    bio = BIO_new_mem_buf(base64String.c_str(), -1);
    b64 = BIO_new(BIO_f_base64());
    bio = BIO_push(b64, bio);

    BIO_set_flags(bio, BIO_FLAGS_BASE64_NO_NL);
    decodeLen = BIO_read(bio, buffer.data(), static_cast<int>(base64String.size()));
    buffer.resize(decodeLen);
    BIO_free_all(bio);

    return buffer;
}

class AESWrapper : public Napi::ObjectWrap<AESWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    AESWrapper(const Napi::CallbackInfo& info);
    Napi::Value Encrypt(const Napi::CallbackInfo& info);
    Napi::Value Decrypt(const Napi::CallbackInfo& info);

private:
    AES_KEY encryptKey;
    AES_KEY decryptKey;
    int keySize;
    std::string mode;
    std::vector<unsigned char> iv;
};

Napi::Object AESWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "AESWrapper", {
        InstanceMethod("encrypt", &AESWrapper::Encrypt),
        InstanceMethod("decrypt", &AESWrapper::Decrypt)
    });

    Napi::FunctionReference* constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);
    exports.Set("AESWrapper", func);

    return exports;
}

AESWrapper::AESWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<AESWrapper>(info) {
    std::string key = info[0].As<Napi::String>().Utf8Value();
    this->keySize = info[1].As<Napi::Number>().Int32Value();
    this->mode = info[2].As<Napi::String>().Utf8Value();
    std::string ivStr = info[3].As<Napi::String>().Utf8Value();
    this->iv = std::vector<unsigned char>(ivStr.begin(), ivStr.end());

    AES_set_encrypt_key(reinterpret_cast<const unsigned char*>(key.data()), this->keySize, &encryptKey);
    AES_set_decrypt_key(reinterpret_cast<const unsigned char*>(key.data()), this->keySize, &decryptKey);
}

Napi::Value AESWrapper::Encrypt(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    std::string plainText = info[0].As<Napi::String>().Utf8Value();
    size_t padding = AES_BLOCK_SIZE - (plainText.size() % AES_BLOCK_SIZE);
    std::string paddedText = plainText + std::string(padding, static_cast<char>(padding));

    std::vector<unsigned char> encryptedText(paddedText.size());
    for (size_t i = 0; i < paddedText.size(); i += AES_BLOCK_SIZE) {
        AES_encrypt(reinterpret_cast<const unsigned char*>(paddedText.data() + i), encryptedText.data() + i, &encryptKey);
    }

    return Napi::String::New(env, base64Encode(encryptedText.data(), encryptedText.size()));
}

Napi::Value AESWrapper::Decrypt(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    std::vector<unsigned char> decodedText = base64Decode(info[0].As<Napi::String>().Utf8Value());
    std::vector<unsigned char> decryptedText(decodedText.size());

    for (size_t i = 0; i < decodedText.size(); i += AES_BLOCK_SIZE) {
        AES_decrypt(decodedText.data() + i, decryptedText.data() + i, &decryptKey);
    }

    size_t padding = decryptedText.back();
    return Napi::String::New(env, std::string(reinterpret_cast<const char*>(decryptedText.data()), decryptedText.size() - padding));
}

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    return AESWrapper::Init(env, exports);
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, InitAll)
