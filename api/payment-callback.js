export default function handler(req, res) {
    // ICICI sends a POST request. Vercel Static sites reject POST with 405.
    // This function accepts the POST, identifies the query parameters, 
    // and redirects the user back to the Angular app (root) using GET.

    if (req.method === 'POST') {
        // Extract query params from the request
        // Note: req.query in Vercel functions contains the parsed query string
        const queryParams = new URLSearchParams(req.query).toString();

        // Redirect to the homepage with the same query parameters
        // 303 See Other enforces a GET request on the redirection target
        res.redirect(303, `/?${queryParams}`);
    } else {
        // If it's already a GET (or other), just pass it through or redirect
        const queryParams = new URLSearchParams(req.query).toString();
        res.redirect(303, `/?${queryParams}`);
    }
}
