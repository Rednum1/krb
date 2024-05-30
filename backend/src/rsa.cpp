#include <napi.h>
#include <openssl/rsa.h>
#include <openssl/pem.h>
#include <openssl/err.h>
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

class RSAWrapper : public Napi::ObjectWrap<RSAWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(env, "RSAWrapper", {
            InstanceMethod("generateKeys", &RSAWrapper::GenerateKeys),
            InstanceMethod("encrypt", &RSAWrapper::Encrypt),
            InstanceMethod("decrypt", &RSAWrapper::Decrypt)
        });

        constructor = Napi::Persistent(func);
        constructor.SuppressDestruct();

        exports.Set("RSAWrapper", func);
        return exports;
    }

    RSAWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<RSAWrapper>(info) {
        rsa = RSA_new();
    }

    ~RSAWrapper() {
        RSA_free(rsa);
    }

    Napi::Value GenerateKeys(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();

        BIGNUM* e = BN_new();
        BN_set_word(e, RSA_F4);

        RSA_generate_key_ex(rsa, 2048, e, NULL);
        BN_free(e);

        BIO* privBio = BIO_new(BIO_s_mem());
        BIO* pubBio = BIO_new(BIO_s_mem());

        PEM_write_bio_RSAPrivateKey(privBio, rsa, NULL, NULL, 0, NULL, NULL);
        PEM_write_bio_RSA_PUBKEY(pubBio, rsa);

        BUF_MEM* privBuffer;
        BUF_MEM* pubBuffer;

        BIO_get_mem_ptr(privBio, &privBuffer);
        BIO_get_mem_ptr(pubBio, &pubBuffer);

        std::string privKey(privBuffer->data, privBuffer->length);
        std::string pubKey(pubBuffer->data, pubBuffer->length);

        BIO_free_all(privBio);
        BIO_free_all(pubBio);

        Napi::Object keys = Napi::Object::New(env);
        keys.Set("publicKey", Napi::String::New(env, pubKey));
        keys.Set("privateKey", Napi::String::New(env, privKey));

        return keys;
    }

    Napi::Value Encrypt(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();

        std::string publicKey = info[0].As<Napi::String>().Utf8Value();
        std::string text = info[1].As<Napi::String>().Utf8Value();

        BIO* bio = BIO_new_mem_buf(publicKey.data(), -1);
        RSA* pubKey = PEM_read_bio_RSA_PUBKEY(bio, NULL, NULL, NULL);
        BIO_free(bio);

        std::vector<unsigned char> encryptedText(RSA_size(pubKey));
        int len = RSA_public_encrypt(text.size(), reinterpret_cast<const unsigned char*>(text.data()), encryptedText.data(), pubKey, RSA_PKCS1_OAEP_PADDING);
        RSA_free(pubKey);

        if (len == -1) {
            throw std::runtime_error("RSA encryption failed");
        }

        return Napi::String::New(env, base64Encode(encryptedText.data(), len));
    }

    Napi::Value Decrypt(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();

        std::string privateKey = info[0].As<Napi::String>().Utf8Value();
        std::string text = info[1].As<Napi::String>().Utf8Value();

        BIO* bio = BIO_new_mem_buf(privateKey.data(), -1);
        RSA* privKey = PEM_read_bio_RSAPrivateKey(bio, NULL, NULL, NULL);
        BIO_free(bio);

        std::vector<unsigned char> decodedText = base64Decode(text);
        std::vector<unsigned char> decryptedText(RSA_size(privKey));
        int len = RSA_private_decrypt(decodedText.size(), decodedText.data(), decryptedText.data(), privKey, RSA_PKCS1_OAEP_PADDING);
        RSA_free(privKey);

        if (len == -1) {
            throw std::runtime_error("RSA decryption failed");
        }

        return Napi::String::New(env, std::string(reinterpret_cast<const char*>(decryptedText.data()), len));
    }

private:
    RSA* rsa;
    static Napi::FunctionReference constructor;
};

Napi::FunctionReference RSAWrapper::constructor;

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    return RSAWrapper::Init(env, exports);
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)
