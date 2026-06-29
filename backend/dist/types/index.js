"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestStatus = exports.PreferredResolution = exports.IssueType = void 0;
// Client-compatible TypeScript Enums for SQLite support
var IssueType;
(function (IssueType) {
    IssueType["DAMAGED_PRODUCT"] = "DAMAGED_PRODUCT";
    IssueType["WRONG_CUSTOMIZATION"] = "WRONG_CUSTOMIZATION";
    IssueType["MISSING_ITEMS"] = "MISSING_ITEMS";
    IssueType["LATE_DELIVERY"] = "LATE_DELIVERY";
    IssueType["WRONG_PRODUCT"] = "WRONG_PRODUCT";
    IssueType["REPLACEMENT_REQUEST"] = "REPLACEMENT_REQUEST";
    IssueType["REFUND_REQUEST"] = "REFUND_REQUEST";
})(IssueType || (exports.IssueType = IssueType = {}));
var PreferredResolution;
(function (PreferredResolution) {
    PreferredResolution["REFUND"] = "REFUND";
    PreferredResolution["REPLACEMENT"] = "REPLACEMENT";
})(PreferredResolution || (exports.PreferredResolution = PreferredResolution = {}));
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["PENDING"] = "PENDING";
    RequestStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    RequestStatus["APPROVED"] = "APPROVED";
    RequestStatus["REJECTED"] = "REJECTED";
    RequestStatus["REPLACEMENT_INITIATED"] = "REPLACEMENT_INITIATED";
    RequestStatus["REPLACEMENT_SHIPPED"] = "REPLACEMENT_SHIPPED";
    RequestStatus["REFUND_INITIATED"] = "REFUND_INITIATED";
    RequestStatus["REFUND_COMPLETED"] = "REFUND_COMPLETED";
    RequestStatus["CLOSED"] = "CLOSED";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
