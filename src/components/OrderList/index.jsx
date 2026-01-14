import React from 'react';

const OrderList = ({ orders }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-50';
      case 'shipping':
        return 'text-blue-600 bg-blue-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-xl card-shadow p-4">
          {/* 订单头部 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <span className="text-gray-900 font-medium">订单号: {order.id}</span>
              <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {order.statusText}
              </span>
            </div>
            <span className="text-gray-500 text-sm">{order.date}</span>
          </div>
          
          {/* 商品列表 */}
          <div className="space-y-3 mb-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="ml-3 flex-1">
                  <h4 className="text-gray-900 text-sm font-medium line-clamp-1">
                    {item.name}
                  </h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-500 text-xs">x{item.quantity}</span>
                    <span className="text-red-500 font-medium">¥{item.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 订单总价 */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-gray-600">共{order.items.length}件商品</span>
            <div className="flex items-center">
              <span className="text-gray-600 mr-2">合计:</span>
              <span className="text-red-500 font-bold text-lg">¥{order.total}</span>
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex justify-end mt-3 space-x-2">
            {order.status === 'shipping' && (
              <button className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm">
                查看物流
              </button>
            )}
            {order.status === 'delivered' && (
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
                再次购买
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderList;
