#include <napi.h>
#include <openssl/rsa.h>
#include <openssl/pem.h>
#include <openssl/evp.h>
#include <string>
#include <vector>

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
        Napi::Env env = info.Env();
        Napi::HandleScope scope(env);
    }

private:
    static Napi::FunctionReference constructor;

    Napi::Value GenerateKeys(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        Napi::HandleScope scope(env);

        int bits = 2048;
        unsigned long e = RSA_F4;

        EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new_id(EVP_PKEY_RSA, NULL);
        EVP_PKEY_keygen_init(ctx);
        EVP_PKEY_CTX_set_rsa_keygen_bits(ctx, bits);

        EVP_PKEY *pkey = NULL;
        EVP_PKEY_keygen(ctx, &pkey);
        EVP_PKEY_CTX_free(ctx);

        BIO *pri = BIO_new(BIO_s_mem());
        PEM_write_bio_PrivateKey(pri, pkey, NULL, NULL, 0, NULL, NULL);
        size_t pri_len = BIO_pending(pri);
        std::vector<char> pri_key(pri_len);
        BIO_read(pri, pri_key.data(), pri_len);
        BIO_free_all(pri);

        BIO *pub = BIO_new(BIO_s_mem());
        PEM_write_bio_PUBKEY(pub, pkey);
        size_t pub_len = BIO_pending(pub);
        std::vector<char> pub_key(pub_len);
        BIO_read(pub, pub_key.data(), pub_len);
        BIO_free_all(pub);

        EVP_PKEY_free(pkey);

        Napi::Object keys = Napi::Object::New(env);
        keys.Set("privateKey", Napi::String::New(env, pri_key.data(), pri_len));
        keys.Set("publicKey", Napi::String::New(env, pub_key.data(), pub_len));

        return keys;
    }

    Napi::Value Encrypt(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        Napi::HandleScope scope(env);

        std::string publicKey = info[0].As<Napi::String>().Utf8Value();
        std::string plainText = info[1].As<Napi::String>().Utf8Value();

        BIO *keybio = BIO_new_mem_buf((void*)publicKey.c_str(), -1);
        EVP_PKEY *pkey = PEM_read_bio_PUBKEY(keybio, NULL, NULL, NULL);
        BIO_free_all(keybio);

        if (!pkey) {
            Napi::TypeError::New(env, "Invalid public key").ThrowAsJavaScriptException();
            return env.Null();
        }

        EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new(pkey, NULL);
        EVP_PKEY_encrypt_init(ctx);
        EVP_PKEY_CTX_set_rsa_padding(ctx, RSA_PKCS1_OAEP_PADDING);

        size_t outlen;
        EVP_PKEY_encrypt(ctx, NULL, &outlen, reinterpret_cast<const unsigned char*>(plainText.data()), plainText.size());
        std::vector<unsigned char> encrypted(outlen);
        EVP_PKEY_encrypt(ctx, encrypted.data(), &outlen, reinterpret_cast<const unsigned char*>(plainText.data()), plainText.size());

        EVP_PKEY_CTX_free(ctx);
        EVP_PKEY_free(pkey);

        return Napi::String::New(env, std::string(reinterpret_cast<char*>(encrypted.data()), outlen));
    }

    Napi::Value Decrypt(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        Napi::HandleScope scope(env);

        std::string privateKey = info[0].As<Napi::String>().Utf8Value();
        std::string cipherText = info[1].As<Napi::String>().Utf8Value();

        BIO *keybio = BIO_new_mem_buf((void*)privateKey.c_str(), -1);
        EVP_PKEY *pkey = PEM_read_bio_PrivateKey(keybio, NULL, NULL, NULL);
        BIO_free_all(keybio);

        if (!pkey) {
            Napi::TypeError::New(env, "Invalid private key").ThrowAsJavaScriptException();
            return env.Null();
        }

        EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new(pkey, NULL);
        EVP_PKEY_decrypt_init(ctx);
        EVP_PKEY_CTX_set_rsa_padding(ctx, RSA_PKCS1_OAEP_PADDING);

        size_t outlen;
        EVP_PKEY_decrypt(ctx, NULL, &outlen, reinterpret_cast<const unsigned char*>(cipherText.data()), cipherText.size());
        std::vector<unsigned char> decrypted(outlen);
        EVP_PKEY_decrypt(ctx, decrypted.data(), &outlen, reinterpret_cast<const unsigned char*>(cipherText.data()), cipherText.size());

        EVP_PKEY_CTX_free(ctx);
        EVP_PKEY_free(pkey);

        return Napi::String::New(env, std::string(reinterpret_cast<char*>(decrypted.data()), outlen));
    }
};

Napi::FunctionReference RSAWrapper::constructor;

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    return RSAWrapper::Init(env, exports);
}

NODE_API_MODULE(rsa, Init)
