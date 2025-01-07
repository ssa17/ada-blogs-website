export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-red-600">404</h1>
                <p className="text-lg text-gray-700">Page Not Found</p>
                <a href="/" className="text-blue-500 underline mt-4">
                    Go Back to Home
                </a>
            </div>
        </div>
    );
}
