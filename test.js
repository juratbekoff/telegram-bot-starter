function decodeString(encodedString) {
    try {
        // Step 1: URL decode
        const urlDecoded = decodeURIComponent(encodedString);

        // Step 2: Try Base64 decode
        let base64Decoded;
        try {
            base64Decoded = atob(urlDecoded);
        } catch (e) {
            // If Base64 fails, the URL decoded string might already be the final result
            base64Decoded = urlDecoded;
        }

        // Step 3: Try JSON parse
        try {
            const jsonParsed = JSON.parse(base64Decoded);
            return {
                success: true,
                result: jsonParsed,
                type: 'json'
            };
        } catch (e) {
            // If JSON parse fails, return the decoded string
            return {
                success: true,
                result: base64Decoded,
                type: 'string'
            };
        }

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Usage example:
const encodedString = "JTdCJTIybXVpZCUyMiUzQSUyMjgxMmU0MjI3LTk1NjQtNDgzYi04NGJmLTFiOGNiMjZlYjE5NDJhODVhOCUyMiUyQyUyMnNpZCUyMiUzQSUyMmUyZTI3MDRhLTQwZmEtNDUwZC04MTY2LWY0MTQ1OGU0ZTI5NGU2M2ZjMyUyMiUyQyUyMnVybCUyMiUzQSUyMmh0dHBzJTNBJTJGJTJGZVVRNnU5NE0yQURwb0pIVjdIRDJYaExHUzhkTENMdEdFVER3MTlGSzVRdy56VEdwUl9BTE9NSW1Cck1zcnhsWVRHbzU0cmlWV0ZWeTA1MkxpYllMYnZRLld6N0ZFNjFUcFdlb1lTYl9NU0tuUjVZMkVsRzBFVjZ4cUVaaHNWRHF2bHMlMkZXVy1leHFHbEVKOUIxZTRyZ0JwOW16dG9YNFdWODh1OTB1RDc2cmRuM21jJTJGSW5lTFF1TC1Iay04RnoyVDdWZ1VYR25XV0tTbzd0Nlp3NGRnM0VnSnBtTSUyRmxZa1BtTzVzUG5WV2V1bWp5ZF9ySEFtdWU5QlVaS1NkamdIeXQ2bzk2MkklMjIlMkMlMjJzb3VyY2UlMjIlM0ElMjJtb3VzZS10aW1pbmdzLTEwJTIyJTJDJTIyZGF0YSUyMiUzQSU1QjE1NzY2JTJDMCUyQzglMkM3JTJDOCUyQzglMkM4JTJDOCUyQzglMkM4JTVEJTdE";

const result = decodeString(encodedString);
console.log(result);

// One-liner version if you just want the decoded result:
const quickDecode = (str) => JSON.parse(decodeURIComponent(str));

// Example usage:
console.log(quickDecode(encodedString));