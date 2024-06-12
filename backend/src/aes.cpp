#include <napi.h>
#include <openssl/aes.h>
#include <openssl/rand.h>
#include <openssl/evp.h>
#include <openssl/bio.h>
#include <openssl/buffer.h>
#include <string>
#include <vector>
#include <iostream>

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
    Napi::Value GetIV(const Napi::CallbackInfo& info);

private:
    AES_KEY encryptKey;
    AES_KEY decryptKey;
    std::vector<unsigned char> iv;
    std::string mode;

    void AES_ECB_encrypt(const std::vector<unsigned char>& plainText, std::vector<unsigned char>& cipherText);
    void AES_ECB_decrypt(const std::vector<unsigned char>& cipherText, std::vector<unsigned char>& plainText);

    void AES_CBC_encrypt(const std::vector<unsigned char>& plainText, std::vector<unsigned char>& cipherText);
    void AES_CBC_decrypt(const std::vector<unsigned char>& cipherText, std::vector<unsigned char>& plainText);

    void AES_CFB_encrypt(const std::vector<unsigned char>& plainText, std::vector<unsigned char>& cipherText);
    void AES_CFB_decrypt(const std::vector<unsigned char>& cipherText, std::vector<unsigned char>& plainText);

    void handlePadding(std::vector<unsigned char>& text, bool addPadding);
};

Napi::Object AESWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "AESWrapper", {
        InstanceMethod("encrypt", &AESWrapper::Encrypt),
        InstanceMethod("decrypt", &AESWrapper::Decrypt),
        InstanceMethod("getIV", &AESWrapper::GetIV)
    });

    Napi::FunctionReference* constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);
    exports.Set("AESWrapper", func);

    return exports;
}

AESWrapper::AESWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<AESWrapper>(info) {
    std::string key = info[0].As<Napi::String>().Utf8Value();
    this->mode = info[1].As<Napi::String>().Utf8Value();
    this->iv = std::vector<unsigned char>(AES_BLOCK_SIZE);

    if (mode == "CBC" || mode == "CFB") {
        if (info.Length() > 2) {
            std::string ivStr = info[2].As<Napi::String>().Utf8Value();
            if (ivStr.size() != AES_BLOCK_SIZE) {
                Napi::Error::New(info.Env(), "IV must be 16 bytes for CBC and CFB modes").ThrowAsJavaScriptException();
                return;
            }
            std::copy(ivStr.begin(), ivStr.end(), this->iv.begin());
        } else {
            Napi::Error::New(info.Env(), "IV must be provided for CBC and CFB modes").ThrowAsJavaScriptException();
            return;
        }
    }

    int keyLength = key.size() * 8;
    if (keyLength != 128 && keyLength != 192 && keyLength != 256) {
        Napi::Error::New(info.Env(), "Key must be 128, 192, or 256 bits").ThrowAsJavaScriptException();
        return;
    }
    AES_set_encrypt_key(reinterpret_cast<const unsigned char*>(key.data()), keyLength, &encryptKey);
    AES_set_decrypt_key(reinterpret_cast<const unsigned char*>(key.data()), keyLength, &decryptKey);
}

void AESWrapper::AES_ECB_encrypt(const std::vector<unsigned char>& plainText, std::vector<unsigned char>& cipherText) {
    for (size_t i = 0; i < plainText.size(); i += AES_BLOCK_SIZE) {
        AES_encrypt(plainText.data() + i, cipherText.data() + i, &encryptKey);
    }
}

void AESWrapper::AES_ECB_decrypt(const std::vector<unsigned char>& cipherText, std::vector<unsigned char>& plainText) {
    for (size_t i = 0; i < cipherText.size(); i += AES_BLOCK_SIZE) {
        AES_decrypt(cipherText.data() + i, plainText.data() + i, &decryptKey);
    }
}

void AESWrapper::AES_CBC_encrypt(const std::vector<unsigned char>& plainText, std::vector<unsigned char>& cipherText) {
    std::vector<unsigned char> iv_copy = this->iv;
    AES_cbc_encrypt(plainText.data(), cipherText.data(), plainText.size(), &encryptKey, iv_copy.data(), AES_ENCRYPT);
}

void AESWrapper::AES_CBC_decrypt(const std::vector<unsigned char>& cipherText, std::vector<unsigned char>& plainText) {
    std::vector<unsigned char> iv_copy = this->iv;
    AES_cbc_encrypt(cipherText.data(), plainText.data(), cipherText.size(), &decryptKey, iv_copy.data(), AES_DECRYPT);
}

void AESWrapper::AES_CFB_encrypt(const std::vector<unsigned char>& plainText, std::vector<unsigned char>& cipherText) {
    std::vector<unsigned char> iv_copy = this->iv;
    int num = 0;
    AES_cfb128_encrypt(plainText.data(), cipherText.data(), plainText.size(), &encryptKey, iv_copy.data(), &num, AES_ENCRYPT);
}

void AESWrapper::AES_CFB_decrypt(const std::vector<unsigned char>& cipherText, std::vector<unsigned char>& plainText) {
    std::vector<unsigned char> iv_copy = this->iv;
    int num = 0;
    AES_cfb128_encrypt(cipherText.data(), plainText.data(), cipherText.size(), &decryptKey, iv_copy.data(), &num, AES_DECRYPT);
}

void AESWrapper::handlePadding(std::vector<unsigned char>& text, bool addPadding) {
    if (addPadding) {
        size_t padding = AES_BLOCK_SIZE - (text.size() % AES_BLOCK_SIZE);
        text.insert(text.end(), padding, static_cast<unsigned char>(padding));
    } else {
        size_t padding = text.back();
        if (padding > AES_BLOCK_SIZE) {
            throw std::runtime_error("Invalid padding");
        }
        text.resize(text.size() - padding);
    }
}

Napi::Value AESWrapper::Encrypt(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    std::string plainText = info[0].As<Napi::String>().Utf8Value();
    std::vector<unsigned char> paddedText(plainText.begin(), plainText.end());
    handlePadding(paddedText, true);

    std::vector<unsigned char> encryptedText(paddedText.size());

    if (this->mode == "ECB") {
        AES_ECB_encrypt(paddedText, encryptedText);
    } else if (this->mode == "CBC") {
        AES_CBC_encrypt(paddedText, encryptedText);
    } else if (this->mode == "CFB") {
        AES_CFB_encrypt(paddedText, encryptedText);
    } else {
        Napi::Error::New(env, "Unsupported mode").ThrowAsJavaScriptException();
        return env.Null();
    }

    return Napi::String::New(env, base64Encode(encryptedText.data(), encryptedText.size()));
}

Napi::Value AESWrapper::Decrypt(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    std::vector<unsigned char> decodedText = base64Decode(info[0].As<Napi::String>().Utf8Value());
    std::vector<unsigned char> decryptedText(decodedText.size());

    if (this->mode == "ECB") {
        AES_ECB_decrypt(decodedText, decryptedText);
    } else if (this->mode == "CBC") {
        AES_CBC_decrypt(decodedText, decryptedText);
    } else if (this->mode == "CFB") {
        AES_CFB_decrypt(decodedText, decryptedText);
    } else {
        Napi::Error::New(env, "Unsupported mode").ThrowAsJavaScriptException();
        return env.Null();
    }

    try {
        handlePadding(decryptedText, false);
    } catch (const std::runtime_error& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }

    return Napi::String::New(env, std::string(decryptedText.begin(), decryptedText.end()));
}

Napi::Value AESWrapper::GetIV(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::String::New(env, base64Encode(this->iv.data(), this->iv.size()));
}

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    return AESWrapper::Init(env, exports);
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, InitAll)
