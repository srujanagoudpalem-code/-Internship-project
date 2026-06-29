"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcrypt = __importStar(require("bcryptjs"));
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var roles, _i, roles_1, role, passwordHash, admin, support, customer, products, seededProducts, _a, products_1, prod, p, order1, order2, order3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('Seeding database...');
                    roles = [
                        { id: 1, name: 'ADMIN' },
                        { id: 2, name: 'SUPPORT_EXECUTIVE' },
                        { id: 3, name: 'CUSTOMER' },
                    ];
                    _i = 0, roles_1 = roles;
                    _b.label = 1;
                case 1:
                    if (!(_i < roles_1.length)) return [3 /*break*/, 4];
                    role = roles_1[_i];
                    return [4 /*yield*/, prisma.role.upsert({
                            where: { id: role.id },
                            update: { name: role.name },
                            create: { id: role.id, name: role.name },
                        })];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log('Roles seeded.');
                    return [4 /*yield*/, bcrypt.hash('password123', 10)];
                case 5:
                    passwordHash = _b.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'admin@giftstore.com' },
                            update: {},
                            create: {
                                email: 'admin@giftstore.com',
                                passwordHash: passwordHash,
                                name: 'Jane Doe (Admin)',
                                phone: '+1234567890',
                                roleId: 1, // ADMIN
                            },
                        })];
                case 6:
                    admin = _b.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'support@giftstore.com' },
                            update: {},
                            create: {
                                email: 'support@giftstore.com',
                                passwordHash: passwordHash,
                                name: 'John Smith (Support)',
                                phone: '+1987654321',
                                roleId: 2, // SUPPORT_EXECUTIVE
                            },
                        })];
                case 7:
                    support = _b.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'customer@giftstore.com' },
                            update: {},
                            create: {
                                email: 'customer@giftstore.com',
                                passwordHash: passwordHash,
                                name: 'Alice Cooper',
                                phone: '+1555123456',
                                roleId: 3, // CUSTOMER
                            },
                        })];
                case 8:
                    customer = _b.sent();
                    console.log('Users seeded (password is "password123").');
                    products = [
                        {
                            sku: 'GIFT-WOOD-FRAME-01',
                            name: 'Custom Engraved Wooden Photo Frame',
                            description: 'Laser engraved premium wood frame with personalized names and date.',
                            price: 29.99,
                            imageUrl: 'https://images.unsplash.com/photo-1544273677-c433136021d4?w=500',
                        },
                        {
                            sku: 'GIFT-SLVR-RING-02',
                            name: 'Personalized Silver Couple Promise Rings',
                            description: 'Sterling silver matching rings with custom interior engraving.',
                            price: 79.99,
                            imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500',
                        },
                        {
                            sku: 'GIFT-LTHR-WLLT-03',
                            name: 'Customized Leather Men Travel Wallet',
                            description: 'Genuine full-grain leather wallet with custom hot-stamped initials.',
                            price: 45.00,
                            imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500',
                        },
                        {
                            sku: 'GIFT-MUG-CERM-04',
                            name: 'Personalized Ceramic Mug with Photo',
                            description: 'Heat reactive ceramic mug that reveals a printed image when hot.',
                            price: 14.99,
                            imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500',
                        },
                    ];
                    seededProducts = [];
                    _a = 0, products_1 = products;
                    _b.label = 9;
                case 9:
                    if (!(_a < products_1.length)) return [3 /*break*/, 12];
                    prod = products_1[_a];
                    return [4 /*yield*/, prisma.product.upsert({
                            where: { sku: prod.sku },
                            update: prod,
                            create: prod,
                        })];
                case 10:
                    p = _b.sent();
                    seededProducts.push(p);
                    _b.label = 11;
                case 11:
                    _a++;
                    return [3 /*break*/, 9];
                case 12:
                    console.log('Products seeded.');
                    return [4 /*yield*/, prisma.order.upsert({
                            where: { orderNumber: 'ORD-98231A' },
                            update: {},
                            create: {
                                orderNumber: 'ORD-98231A',
                                userId: customer.id,
                                purchaseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
                                deliveryDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
                                status: 'DELIVERED',
                                orderItems: {
                                    create: [
                                        {
                                            productId: seededProducts[0].id,
                                            quantity: 1,
                                            price: seededProducts[0].price,
                                        },
                                        {
                                            productId: seededProducts[1].id,
                                            quantity: 1,
                                            price: seededProducts[1].price,
                                        },
                                    ],
                                },
                            },
                        })];
                case 13:
                    order1 = _b.sent();
                    return [4 /*yield*/, prisma.order.upsert({
                            where: { orderNumber: 'ORD-44129B' },
                            update: {},
                            create: {
                                orderNumber: 'ORD-44129B',
                                userId: customer.id,
                                purchaseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                                deliveryDate: null,
                                status: 'SHIPPED',
                                orderItems: {
                                    create: [
                                        {
                                            productId: seededProducts[2].id,
                                            quantity: 1,
                                            price: seededProducts[2].price,
                                        },
                                    ],
                                },
                            },
                        })];
                case 14:
                    order2 = _b.sent();
                    return [4 /*yield*/, prisma.order.upsert({
                            where: { orderNumber: 'ORD-10928C' },
                            update: {},
                            create: {
                                orderNumber: 'ORD-10928C',
                                userId: customer.id,
                                purchaseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                                deliveryDate: null,
                                status: 'PROCESSING',
                                orderItems: {
                                    create: [
                                        {
                                            productId: seededProducts[3].id,
                                            quantity: 2,
                                            price: seededProducts[3].price,
                                        },
                                    ],
                                },
                            },
                        })];
                case 15:
                    order3 = _b.sent();
                    console.log('Mock Orders seeded for customer: ORD-98231A, ORD-44129B, ORD-10928C');
                    console.log('Seeding completed successfully.');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('Error during seeding:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
