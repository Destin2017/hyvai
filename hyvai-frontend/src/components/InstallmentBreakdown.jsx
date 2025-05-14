const InstallmentBreakdown = ({ product }) => {
    if (!product || !product.price) {
        return <p className="text-gray-600">No product selected.</p>;
    }

    // ✅ Ensure price is a number
    const productPrice = Number(product.price) || 0; 

    return (
        <div className="mb-4 p-4 bg-gray-50 rounded-md">
            <h3 className="font-bold text-lg">{product.name}</h3>
            <p className="text-gray-700">Price: ${productPrice.toFixed(2)}</p>
            <p className="text-gray-700">Upfront Payment: ${(productPrice * 0.60).toFixed(2)}</p>
            <p className="text-gray-700">30 Days Payment: ${(productPrice * 0.25).toFixed(2)}</p>
            <p className="text-gray-700">60 Days Payment: ${(productPrice * 0.15).toFixed(2)}</p>
        </div>
    );
};

export default InstallmentBreakdown;
