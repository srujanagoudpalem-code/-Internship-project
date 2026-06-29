"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("./index"));
// Mock Prisma Client to prevent connection failures during test runs
jest.mock('./config/db', () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        $disconnect: jest.fn(),
    },
}));
describe('Sanity & Health Check Endpoint', () => {
    it('should return 200 OK and status ok', async () => {
        const res = await (0, supertest_1.default)(index_1.default).get('/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'ok');
    });
    it('should return 404 for non-existent routes', async () => {
        const res = await (0, supertest_1.default)(index_1.default).get('/non-existent-route');
        expect(res.statusCode).toEqual(404);
    });
});
