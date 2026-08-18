const crypto = require("crypto");

const verifyGithubSignature = (rawBody,signature) => {

    if (!rawBody || !signature || !process.env.GITHUB_WEBHOOK_SECRET) {
        return false;
    }
    const expectedSignature ="sha256=" + crypto.createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET).update(rawBody).digest("hex");
    const expectedBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(signature);
    if ( expectedBuffer.length !== signatureBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        expectedBuffer,
        signatureBuffer
    );
};

module.exports = verifyGithubSignature;