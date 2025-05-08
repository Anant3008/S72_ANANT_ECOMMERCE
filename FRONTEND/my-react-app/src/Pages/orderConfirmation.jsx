import React, { useState, useEffect } from 'react';
import React, {useState, useEffect} from 'react';
import axios from 'axios';
import Nav from '../components/Nav';
import Nav from "../components/nav";
import { useLocation, useNavigate } from 'react-router-dom';
import {PayPalScriptProvider,PayPalButtons} from '@paypal/react-paypal-js';

const OrderConfirmation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { addressId, email } = location.state || {};
    const {addressId, email} = location.state || {};

    const [selectedAddress, setSelectedAddress] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

        const [paymentMethod,setPaymentMethod]=useState('cod');

    useEffect(() => {
        if (!addressId || !email) {
        if(!addressId || !email) {
            navigate('/select-address');
            return;
        }

        const fetchData = async () => {
            try {
                const addressResponse = await axios.get('http://localhost:8000/api/v2/user/profile', {
                    params: { email }
                const addressResponse = await axios.get('http://localhost:8000/api/v2/user/addresses', {
                    params: {email: email},
                });

                if (addressResponse.status !== 200) {
                if(addressResponse.status !== 200) {
                    throw new Error(`Failed to fetch addresses. Status: ${addressResponse.status}`);
                }

@@ -37,50 +39,51 @@ const OrderConfirmation = () => {
                }
                setSelectedAddress(address);

                // Fetch cart products from /cartproducts endpoint
                const cartResponse = await axios.get('http://localhost:8000/api/v2/product/cartproducts', {
                    params: { email }
                    params: { email: email },
                });

                if (cartResponse.status !== 200) {
                    throw new Error(`Failed to fetch cart products. Status: ${cartResponse.status}`);
                }

                const cartData = cartResponse.data;

                const processedCartItems = cartData.cart.map(item => ({
                    _id: item.productId._id,
                    name: item.productId.name,
                    price: item.productId.price,
                    images: item.productId.image.map(imagePath => `http://localhost:8000${imagePath}`),
                    images: item.productId.images.map(imagePath => `http://localhost:8000${imagePath}`),
                    quantity: item.quantity,
                }));

                setCartItems(processedCartItems);

                const total = processedCartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
                setTotalPrice(total);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching data", err);
                setError(err.response?.data?.message || err.message || "An unexpected error occurred.");
            } catch(err) {
                console.error('Error fetching data:', err);
                setError(err.response?.data?.message || err.message || 'An unexpected error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [addressId, email, navigate]);

    const handlePlaceOrder = async () => {
        try {
    const handlePlaceOrder = async (paymentType='cod', paypalOrderData=null) => {
        try{
            const orderItems = cartItems.map(item => ({
                product: item._id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                image: item.images && item.images.length > 0 
                    ? item.images[0] 
                    : '/default-avatar.png'
                image: item.images && item.images.length > 0 ? item.images[0] : '/default-avatar.png'
            }));
    
            const payload = {
                email,
                shippingAddress: {
                    address1: selectedAddress.address1,
                    address2: selectedAddress.address2 || "",
@@ -89,36 +92,36 @@ const OrderConfirmation = () => {
                    zipCode: selectedAddress.zipCode, 
                    country: selectedAddress.country
                },
                orderItems,
                paymentMethod:paymentType,
                paypalOrderData,
            };
    
            const response = await axios.post(
                'http://localhost:8000/api/v2/orders/place-order',
                payload
            );
    
            console.log('Orders placed successfully', response.data);
            console.log("Payload being sent:", payload);

            const response = await axios.post('http://localhost:8000/api/v2/orders/place-order', payload);
            console.log('Orders placed successfully!', response.data);
            navigate('/order-success');
        } catch (error) {
            console.error('Error placing the orders: ', error);
        } catch(error) {
            console.error('Error placing the orders:', error);
        }
    };
    

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <div className='w-full h-screen flex justify-center items-center'>
                <p className='text-lg'>Processing...</p>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <p className="text-red-600 text-lg mb-4">Error: {error}</p>
            <div className='w-full h-screen flex flex-col justify-center items-center'>
                <p className='text-red-500 text-lg mb-4'>Error: {error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    className='bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600'
                >
                    Retry
                </button>
@@ -127,98 +130,140 @@ const OrderConfirmation = () => {
    }

    return (
        <div className="min-h-screen bg-gray-50">
        <div className='w-full min-h-screen flex flex-col'>
            <Nav />
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                            Order Confirmation
                        </h2>

                        {/* Shipping Address */}
                        <div className="mb-8">
                            <h3 className="text-xl font-medium text-gray-900 mb-4">
                                Shipping Address
                            </h3>
                            {selectedAddress && (
                                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                    <p className="font-medium text-gray-800">
                                        {selectedAddress.address1}
                                        {selectedAddress.address2 && `, ${selectedAddress.address2}`}
                                    </p>
                                    <p className="text-gray-600">
                                        {selectedAddress.city}, {selectedAddress.country}, {selectedAddress.zipCode}
                                    </p>
                                    <p className="text-gray-500 mt-1">
                                        Type: {selectedAddress.addressType || 'N/A'}
                                    </p>
                                </div>
                            )}
                        </div>
            <div className='flex-grow flex justify-center items-start p-4'>
                <div className='w-full max-w-4xl border border-neutral-300 rounded-md flex flex-col p-6 bg-white shadow-md'>
                    <h2 className='text-2xl font-semibold mb-6 text-center'>Order Confirmation</h2>

                    {/* Selected Address */}
                    <div className='mb-6'>
                        <h3 className='text-xl font-medium mb-2'>Shipping Address</h3>
                        {selectedAddress ? (
                            <div className='p-4 border rounded-md'>
                                <p className='font-medium'>
                                    {selectedAddress.address1}{selectedAddress.address2 ? `, ${selectedAddress.address2}` : ''}, {selectedAddress.city}, {selectedAddress.state}, {selectedAddress.zipCode}
                                </p>
                                <p className='text-sm text-gray-600'>{selectedAddress.country}</p>
                                <p className='text-sm text-gray-500'>Type: {selectedAddress.addressType || 'N/A'}</p>
                            </div>
                        ) : (
                            <p>No address selected.</p>
                        )}
                    </div>

                        {/* Cart Items */}
                        <div className="mb-8">
                            <h3 className="text-xl font-medium text-gray-900 mb-4">
                                Cart Items
                            </h3>
                            <div className="space-y-4">
                    {/* Cart Items */}
                    <div className='mb-6'>
                        <h3 className='text-xl font-medium mb-2'>Cart Items</h3>
                        {cartItems.length > 0 ? (
                            <div className='space-y-4'>
                                {cartItems.map((item) => (
                                    <div key={item._id} 
                                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-200 transition-colors">
                                        <div className="flex items-center space-x-4">
                                    <div key={item._id} className='flex justify-between items-center border p-4 rounded-md'>
                                        <div className='flex items-center'>
                                            <img
                                                src={item.images[0]}
                                                src={item.images && item.images.length > 0 ? item.images[0] : '/default-avatar.png'} // Use first image or fallback
                                                alt={item.name}
                                                className="w-16 h-16 object-cover rounded-lg"
                                                className='w-16 h-16 object-cover rounded-md mr-4'
                                            />
                                            <div>
                                                <h4 className="font-medium text-gray-900">{item.name}</h4>
                                                <p className="text-gray-600">Quantity: {item.quantity}</p>
                                                <p className="text-gray-600">Price: ${item.price.toFixed(2)}</p>
                                                <p className='font-medium'>{item.name}</p>
                                                <p className='text-sm text-gray-600'>Quantity: {item.quantity}</p>
                                                <p className='text-sm text-gray-600'>Price: ${item.price.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <p className="font-semibold text-blue-600">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </p>
                                        <div>
                                            <p className='font-semibold'>${(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        ) : (
                            <p>Your cart is empty.</p>
                        )}
                    </div>

                        {/* Total Price */}
                        <div className="mb-8 flex justify-end">
                            <p className="text-2xl font-semibold text-blue-600">
                                Total: ${totalPrice.toFixed(2)}
                            </p>
                    {/* Total Price */}
                    <div className='mb-6 flex justify-end'>
                        <p className='text-xl font-semibold'>Total: ${totalPrice.toFixed(2)}</p>
                    </div>
                        {/* Payment Method (Cash on Delivery or PayPal) */}
                     <div className='mb-6'>
                        <h3 className='text-xl font-medium mb-2'>Payment Method</h3>
                        <div className='p-4 border rounded-md space-x-4'>
                            <label className='mr-4'>
                                <input
                                    type='radio'
                                    name='paymentMethod'
                                    value='cod'
                                    checked={paymentMethod === 'cod'}
                                    onChange={() => setPaymentMethod('cod')}
                                />
                                <span className='ml-2'>Cash on Delivery</span>
                            </label>
                            <label>
                                <input
                                    type='radio'
                                    name='paymentMethod'
                                    value='paypal'
                                    checked={paymentMethod === 'paypal'}
                                    onChange={() => setPaymentMethod('paypal')}
                                />
                                <span className='ml-2'>Pay Online (PayPal)</span>
                            </label>
                        </div>
                            {paymentMethod === 'paypal' && (
                            <div className='mt-4' style={{ maxWidth: '500px' }}>
                                <PayPalScriptProvider
                                    options={{
                                        'client-id': 'AapgmGvxFKztKUaQw6VRpPa6sRVD7AwV7sUTvvZYZUxtKBPBClzXCSxFgCbfh9rUaoQWlUqoE2cscrh7', 
                                    }}
                                >
                                    <PayPalButtons
                                        style={{ layout: 'vertical' }}
                                        createOrder={(data, actions) => {
                                            return actions.order.create({
                                                purchase_units: [
                                                    {
                                                        amount: {
                                                            value: totalPrice.toFixed(2),
                                                        },
                                                    },
                                                ],
                                            });
                                        }}
                                        onApprove={async (data, actions) => {
                                            // Captures funds from the transaction
                                            const order = await actions.order.capture();
                                            console.log('PayPal order success:', order);

                        {/* Payment Method */}
                        <div className="mb-8">
                            <h3 className="text-xl font-medium text-gray-900 mb-4">
                                Payment Method
                            </h3>
                            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                <p className="text-gray-800">Cash on Delivery</p>
                                            // Call place order with PayPal data
                                            handlePlaceOrder('paypal', order);
                                        }}
                                        onError={(err) => {
                                            console.error('PayPal checkout error:', err);
                                        }}
                                    />
                                </PayPalScriptProvider>
                            </div>
                        </div>

                        {/* Place Order Button */}
                        <div className="flex justify-center">
                        )}
                    </div>
                    {/* Place Order Button (for COD) */}
                    {paymentMethod === 'cod' && (
                        <div className='flex justify-center'>
                            <button
                                onClick={handlePlaceOrder}
                                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold
                                    hover:bg-blue-700 transform hover:scale-105
                                    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                onClick={() => handlePlaceOrder('cod', null)}
                                className='bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 transition-colors'
                            >
                                Place Order
                            </button>
                        </div>
                    </div>
                    )}

                  
                </div>
            </div>
        </div>
    );
};
}

export default OrderConfirmation;