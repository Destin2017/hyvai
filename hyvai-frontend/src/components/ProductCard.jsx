import { useNavigate } from "react-router-dom";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="border rounded-lg shadow-md p-4 cursor-pointer transition hover:shadow-xl"
      onClick={() => navigate(`/products/${product.id}`)}
    >
      <img
        src={product.image || "/default-product.jpg"}
        alt={product.name}
        className="w-full h-48 object-cover rounded"
      />
      <h3 className="text-lg font-semibold mt-2">{product.name}</h3>
      <p className="text-gray-500 text-sm">${product.price}</p>
    </div>
  );
};

export default ProductCard;
