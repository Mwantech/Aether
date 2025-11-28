"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const body_parser_1 = require("body-parser");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use((0, body_parser_1.json)());
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
const auth_1 = __importDefault(require("./routes/auth"));
const projects_1 = __importDefault(require("./routes/projects"));
const deployments_1 = __importDefault(require("./routes/deployments"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
app.use('/auth', auth_1.default);
app.use('/projects', projects_1.default);
app.use('/deployments', deployments_1.default);
app.use('/webhooks', webhooks_1.default);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
