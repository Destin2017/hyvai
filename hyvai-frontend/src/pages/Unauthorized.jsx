import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-red-600">🚫 Access Denied</h1>
        <p className="text-gray-600 mt-2">
          You do not have permission to access this page.
        </p>
        <Link to="/" className="mt-4 text-blue-500 hover:underline">
          Go back to Home
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
