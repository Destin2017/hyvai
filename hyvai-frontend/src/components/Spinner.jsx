// components/Spinner.jsx
const Spinner = () => {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white bg-opacity-40 backdrop-blur-sm z-50 space-y-4">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-blue-700 font-semibold text-lg">Loading Predictive Data...</div>
      </div>
    );
  };
  
  export default Spinner;
  