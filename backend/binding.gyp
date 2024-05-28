{
  "targets": [
    {
      "target_name": "aes",
      "sources": ["src/aes.cpp"],
      "include_dirs": [
        "<!(node -e \"require('node-addon-api').include\")",
        "C:/Users/Alexander/AppData/Local/node-gyp/Cache/20.12.2/include/node",
        "D:/kp/krb/aes-encryption-app/backend/node_modules/node-addon-api",
        "C:/Program Files/OpenSSL-Win64/include"
      ],
      "libraries": [
        "C:/Program Files/OpenSSL-Win64/lib/VC/x64/MD/libssl.lib",
        "C:/Program Files/OpenSSL-Win64/lib/VC/x64/MD/libcrypto.lib"
      ],
      "cflags": [
        "-DNAPI_VERSION=4"
      ],
      "cflags_cc": [
        "-fexceptions"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ],
      "conditions": [
        ["OS=='win'", {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1
            }
          }
        }]
      ]
    },
    {
      "target_name": "rsa",
      "sources": ["src/rsa.cpp"],
      "include_dirs": [
        "<!(node -e \"require('node-addon-api').include\")",
        "C:/Users/Alexander/AppData/Local/node-gyp/Cache/20.12.2/include/node",
        "D:/kp/krb/aes-encryption-app/backend/node_modules/node-addon-api",
        "C:/Program Files/OpenSSL-Win64/include"
      ],
      "libraries": [
        "C:/Program Files/OpenSSL-Win64/lib/VC/x64/MD/libssl.lib",
        "C:/Program Files/OpenSSL-Win64/lib/VC/x64/MD/libcrypto.lib"
      ],
      "cflags": [
        "-DNAPI_VERSION=4"
      ],
      "cflags_cc": [
        "-fexceptions"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ],
      "conditions": [
        ["OS=='win'", {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1
            }
          }
        }]
      ]
    }
  ]
}
