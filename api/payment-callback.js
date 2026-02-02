export default function handler(req, res) {
    // ICICI sends a POST request. Vercel Static sites reject POST with 405.
    // This function accepts the POST, identifies the query parameters, 
    // and redirects the user back to the Angular app (root) using GET.

    if (req.method === 'POST' || req.method === 'GET') {
        // Extract both query params and body params (for POST)
        const combinedData = { ...req.query, ...req.body };
        const queryParams = new URLSearchParams(combinedData).toString();

        // Redirect to the order-success page with the parameters
        // 303 See Other enforces a GET request on the redirection target
        res.redirect(303, `/order-success?${queryParams}`);
    } else {
        // Fallback for other methods
        res.status(405).send('Method Not Allowed');
    }
}
