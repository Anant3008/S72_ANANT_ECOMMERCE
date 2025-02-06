import {useEffect, useState} from "react";
import PropTypes from "prop-types";
import {useNavigate} from "react-router-dom";

// eslint-disable-next-line react/prop-types
export default function MyProduct({_id,name, images , description , price }) {

    const [currentIndex, setCurrentIndex] = useState(0);
    const navigate=useNavigate();

    useEffect(() => {
        // eslint-disable-next-line react/prop-types
        if(!images || images.length === 0) return;
        const interval=setInterval(() => {
            setCurrentIndex(prevIndex =>{
                // eslint-disable-next-line react/prop-types
                return (prevIndex + 1)%images.length;
            });
        },2000)
        return ()=>clearInterval(interval);
    },[images])


    // eslint-disable-next-line react/prop-types
    const currentImage=images.length>0 ? images[currentIndex] : null

    const handleEdit=()=>{
        navigate(`/product/${_id}`)
    }


    return (
        <div className="bg-neutral-200 p-4 rounded-lg shadow-md flex flex-col justify-between">
            <div className="w-full">
                <img
                    src={`http://localhost:8000${currentImage}`}
                    alt={name}
                    className="w-full h-56 object-cover rounded-lg mb-2"
                />
                <h2 className="text-lg font-bold">{name}</h2>
                <p className="text-sm opacity-50 line-clamp-2">{description}</p>

            </div>


            <div className="w-full">
                {/* eslint-disable-next-line react/prop-types */}
                <p className="text-lg font-bold my-2" > ${price.toFixed(2)}</p>
                <button className="w-full text -white px-4 py-2 rounded-md bg- bg-neutral-900" onClick={handleEdit}>
                    Edit
                </button>
            </div>
        </div>

    );
}



MyProduct.Proptypes = {
    name: PropTypes.string.isRequired,
    images: PropTypes.array.isRequired,
    description: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
}