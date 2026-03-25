import { DEFAULT_CODE } from "../types";

export interface Example {
  name: string;
  code: string;
}

export const EXAMPLES: Example[] = [
  {
    name: "Struct Padding",
    code: `struct PaddingDemo {
    char a;       // 1 byte
    double b;     // 8 bytes — needs 8-byte alignment
    int c;        // 4 bytes
    char d;       // 1 byte
};
`,
  },
  {
    name: "Packed vs Unpacked",
    code: `struct Unpacked {
    char a;
    int b;
    char c;
    double d;
};

struct __attribute__((packed)) Packed {
    char a;
    int b;
    char c;
    double d;
};
`,
  },
  {
    name: "Virtual Inheritance",
    code: `class Base {
public:
    virtual void foo() {}
    int x;
};

class Derived : public Base {
    double y;
    char z;
};
`,
  },
  {
    name: "Pointer Chains",
    code: `struct Node {
    int value;
    Node* next;
};

void example() {
    Node* head = new Node();
    head->value = 1;
    head->next = new Node();
    head->next->value = 2;
    head->next->next = nullptr;
}
`,
  },
  {
    name: "Stack Variables",
    code: `void stackDemo() {
    int a = 10;
    double b = 3.14;
    char buffer[16];
    int* ptr = new int(42);
    float x = 2.5f;
    long long bignum = 123456789LL;
    delete ptr;
}
`,
  },
  {
    name: "Dynamic Arrays",
    code: `#include <cstdlib>

void heapDemo() {
    int* arr = new int[100];
    double* matrix = (double*)malloc(sizeof(double) * 64);
    char* str = new char[256];

    delete[] arr;
    free(matrix);
    delete[] str;
}
`,
  },
  {
    name: "Default Example",
    code: DEFAULT_CODE,
  },
];
