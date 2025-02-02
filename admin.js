// Admin Panel Functionality

// Section Navigation
function showSection(sectionName) {
    // Hide all sections
    ['welcome', 'users', 'orders', 'search', 'add-food'].forEach(section => {
        const sectionElement = document.getElementById(`${section}-section`);
        if (sectionElement) {
            sectionElement.style.display = 'none';
        }
    });

    // Show selected section
    const selectedSection = document.getElementById(`${sectionName}-section`);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }

    // Update welcome section stats if welcome section is shown
    if (sectionName === 'welcome') {
        updateWelcomeSectionStats();
    }
}

// Function to update welcome section stats
function updateWelcomeSectionStats() {
    // Retrieve orders from localStorage
    const adminOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]');

    // Calculate status counts
    const statusCounts = {
        Total: adminOrders.length,
        Pending: adminOrders.filter(order => order.status === 'Pending').length,
        Completed: adminOrders.filter(order => order.status === 'Completed').length
    };

    // Get DOM elements
    const totalOrdersEl = document.getElementById('total-orders-count');
    const pendingOrdersEl = document.getElementById('pending-orders-count');
    const completedOrdersEl = document.getElementById('completed-orders-count');

    // Check if total orders have changed
    const previousTotalOrders = parseInt(totalOrdersEl ? totalOrdersEl.textContent : '0');
    if (statusCounts.Total > previousTotalOrders) {
        // Play notification sound when total orders increase
        playNotificationSound();
    }

    if (totalOrdersEl) totalOrdersEl.textContent = statusCounts.Total;
    if (pendingOrdersEl) pendingOrdersEl.textContent = statusCounts.Pending;
    if (completedOrdersEl) completedOrdersEl.textContent = statusCounts.Completed;

    return statusCounts;
}

// Function to load orders with real-time updates
function loadOrders() {
    const ordersTableBody = document.getElementById('orders-table-body');
    
    // Retrieve orders from localStorage
    const adminOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]');

    // If no orders, show empty state
    if (adminOrders.length === 0) {
        ordersTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px;">
                    No orders placed yet
                </td>
            </tr>
        `;
        return;
    }

    // Render orders
    ordersTableBody.innerHTML = adminOrders.map(order => `
        <tr data-order-id="${order.id}">
            <td>${order.id}</td>
            <td>${order.customerName || (order.user ? order.user.name : 'Unknown')}</td>
            <td>${order.address}</td>
            <td>${order.phone || (order.user ? order.user.phone : 'N/A')}</td>
            <td>
                ${order.food ? order.food.name : (order.items ? order.items.map(item => `${item.name} x${item.quantity}`).join('<br>') : 'No items')}
            </td>
            <td><span class="material-icons rupee-icon">currency_rupee</span>${order.food ? order.food.price : (order.items ? calculateOrderTotal(order.items).toFixed(2) : 0)}</td>
            <td>
                <span class="status-dot status-${order.status === 'Pending' ? 'red' : 'green'}"></span>
                ${order.status}
            </td>
            <td>
                <button onclick="updateOrderStatus('${order.id}')">
                    ${order.status === 'Pending' ? 'Start' : 'Complete'}
                </button>
            </td>
        </tr>
    `).join('');

    // Trigger custom event for cross-tab communication
    document.dispatchEvent(new Event('orderUpdated'));
}

// Calculate total order value
function calculateOrderTotal(items) {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Update order status
function updateOrderStatus(orderId) {
    // Retrieve orders from localStorage
    let adminOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]');
    
    // Find and update the specific order
    const updatedOrders = adminOrders.map(order => {
        if (order.id === orderId) {
            // Determine the next status
            let newStatus;
            switch(order.status) {
                case 'Pending':
                    newStatus = 'Processing';
                    break;
                case 'Processing':
                    newStatus = 'Completed';
                    break;
                default:
                    newStatus = 'Completed';
            }
            
            // Update order status
            order.status = newStatus;
            
            // Dispatch a custom event for cross-tab communication
            document.dispatchEvent(new CustomEvent('orderStatusChanged', { 
                detail: { 
                    orderId: order.id, 
                    newStatus: newStatus 
                } 
            }));
            
            // Broadcast status change via localStorage
            localStorage.setItem('orderStatusBroadcast', JSON.stringify({
                orderId: order.id,
                newStatus: newStatus,
                timestamp: Date.now()
            }));
        }
        return order;
    });

    // Save updated orders back to localStorage
    localStorage.setItem('adminOrders', JSON.stringify(updatedOrders));
    localStorage.setItem('orders', JSON.stringify(updatedOrders));

    // Reload orders to reflect changes
    loadOrders();

    // Attempt to reload orders page if it's open
    try {
        if (window.location.pathname.includes('orders.html')) {
            window.location.reload();
        }
    } catch (error) {
        console.log('Could not reload orders page:', error);
    }
}

// Add event listener for new order updates
document.addEventListener('adminOrderUpdate', function(event) {
    const newOrder = event.detail;

    // Play notification sound when a new order is received
    playNotificationSound();

    // Retrieve current admin orders
    let adminOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]');

    // Check if order already exists to prevent duplicates
    const orderExists = adminOrders.some(order => order.id === newOrder.id);
    
    if (!orderExists) {
        // Add new order to the beginning of the list
        adminOrders.unshift(newOrder);

        // Save updated orders
        localStorage.setItem('adminOrders', JSON.stringify(adminOrders));

        // Reload orders table
        loadOrders();

        // Update welcome section stats
        updateWelcomeSectionStats();
        
        // Show desktop notification
        showDesktopNotification(newOrder);
    }
});

// Add event listener for order status changes
document.addEventListener('orderStatusChanged', function(event) {
    // Update welcome section stats when order status changes
    updateWelcomeSectionStats();
});

// Add event listener for localStorage changes to sync across tabs
window.addEventListener('storage', function(event) {
    if (event.key === 'adminOrders') {
        // Update orders and stats when localStorage changes
        loadOrders();
        updateWelcomeSectionStats();
    }
});

// Enhanced Users Management
function loadUsers() {
    const usersTableBody = document.getElementById('users-table-body');
    
    // Mock enhanced user data (replace with actual backend call)
    const users = [
        { 
            id: 1, 
            name: 'Dhurv singh', 
            email: 'dhruv13june@gmail.com', 
            phone: '1234567890', 
            totalOrders: 15, 
            totalSpent: 3750,
            registeredDate: '2023-01-15',
            status: 'vip'
        },
        { 
            id: 2, 
            name: 'Jane Smith', 
            email: 'jane@example.com', 
            phone: '9876543210', 
            totalOrders: 7, 
            totalSpent: 1850,
            registeredDate: '2023-02-20',
            status: 'frequent'
        },
        { 
            id: 3, 
            name: 'Mike Brown', 
            email: 'mike@example.com', 
            phone: '5551234567', 
            totalOrders: 3, 
            totalSpent: 750,
            registeredDate: '2023-05-10',
            status: 'new'
        }
    ];

    usersTableBody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td>${user.totalOrders}</td>
            <td>₹${user.totalSpent}</td>
            <td>${user.registeredDate}</td>
            <td>
                <button onclick="viewUserDetails(${user.id})">View</button>
                <button onclick="sendUserNotification(${user.id})">Notify</button>
            </td>
        </tr>
    `).join('');
}

function filterUsers() {
    const filterType = document.getElementById('user-filter-type').value;
    const rows = document.querySelectorAll('#users-table-body tr');
    
    rows.forEach(row => {
        const userStatus = row.querySelector('td:nth-child(8)').textContent.toLowerCase();
        row.style.display = (filterType === '' || userStatus.includes(filterType)) ? '' : 'none';
    });
}

function viewUserDetails(userId) {
    // Placeholder for user details modal or page
    alert(`Viewing details for User ID: ${userId}`);
}

function sendUserNotification(userId) {
    // Placeholder for sending user notification
    alert(`Sending notification to User ID: ${userId}`);
}

// Revenue and Analytics Functions
function calculateRevenue() {
    // Get all orders from localStorage
    const adminOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]');
    
    // Initialize detailed revenue tracking
    const revenueMetrics = {
        totalRevenue: 0,
        todayRevenue: 0,
        avgOrderValue: 0,
        completedOrdersCount: 0,
        foodItemRevenue: {},
        orderDetails: []
    };

    // Get today's date
    const today = new Date().toDateString();

    // Process each completed order
    adminOrders.forEach(order => {
        // Only consider completed orders
        if (order.status === 'Completed') {
            // Calculate total order revenue
            const orderTotal = order.items.reduce((total, item) => {
                // Track revenue for each food item
                if (!revenueMetrics.foodItemRevenue[item.name]) {
                    revenueMetrics.foodItemRevenue[item.name] = {
                        totalRevenue: 0,
                        quantity: 0
                    };
                }
                
                const itemTotal = item.price * item.quantity;
                revenueMetrics.foodItemRevenue[item.name].totalRevenue += itemTotal;
                revenueMetrics.foodItemRevenue[item.name].quantity += item.quantity;

                return total + itemTotal;
            }, 0);

            // Update revenue metrics
            revenueMetrics.totalRevenue += orderTotal;
            revenueMetrics.completedOrdersCount++;

            // Check if order is from today
            if (new Date(order.date).toDateString() === today) {
                revenueMetrics.todayRevenue += orderTotal;
            }

            // Store order details for further analysis
            revenueMetrics.orderDetails.push({
                id: order.id,
                total: orderTotal,
                date: order.date,
                items: order.items
            });
        }
    });

    // Calculate average order value
    revenueMetrics.avgOrderValue = revenueMetrics.completedOrdersCount > 0
        ? revenueMetrics.totalRevenue / revenueMetrics.completedOrdersCount
        : 0;

    // Update UI elements
    updateRevenueDisplay(revenueMetrics);

    // Render detailed breakdowns
    renderFoodItemRevenue(revenueMetrics.foodItemRevenue);

    return revenueMetrics;
}

function updateRevenueDisplay(revenueMetrics) {
    // Update revenue cards
    const totalRevenueEl = document.getElementById('total-revenue');
    const todayRevenueEl = document.getElementById('today-revenue');
    const avgOrderValueEl = document.getElementById('avg-order-value');
    
    if (totalRevenueEl) {
        totalRevenueEl.textContent = `₹${revenueMetrics.totalRevenue.toFixed(2)}`;
    }

    if (todayRevenueEl) {
        todayRevenueEl.textContent = `₹${revenueMetrics.todayRevenue.toFixed(2)}`;
    }

    if (avgOrderValueEl) {
        avgOrderValueEl.textContent = `₹${revenueMetrics.avgOrderValue.toFixed(2)}`;
    }
}

function renderFoodItemRevenue(foodItemRevenue) {
    const revenueBreakdownEl = document.querySelector('.revenue-breakdown');
    if (!revenueBreakdownEl) return;

    // Clear previous content
    revenueBreakdownEl.innerHTML = `<h3>Revenue by Food Item</h3>`;

    // Sort food items by revenue in descending order
    const sortedFoodItems = Object.entries(foodItemRevenue)
        .sort((a, b) => b[1].totalRevenue - a[1].totalRevenue);

    // Create revenue breakdown list
    const listEl = document.createElement('div');
    listEl.className = 'revenue-breakdown-list';

    // Find max revenue for percentage calculation
    const maxRevenue = Math.max(...sortedFoodItems.map(([, item]) => item.totalRevenue));

    sortedFoodItems.forEach(([itemName, itemData]) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'revenue-category-item';
        itemEl.innerHTML = `
            <span>${itemName}</span>
            <div class="revenue-bar-container">
                <div class="revenue-bar" style="width: ${(itemData.totalRevenue / maxRevenue * 100).toFixed(2)}%">
                    <span class="revenue-amount">₹${itemData.totalRevenue.toFixed(2)}</span>
                </div>
            </div>
            <span class="revenue-item-quantity">${itemData.quantity} sold</span>
        `;
        listEl.appendChild(itemEl);
    });

    revenueBreakdownEl.appendChild(listEl);
}

function calculateRevenueBreakdown(orders) {
    const categoryRevenue = {};
    const monthlyRevenue = {};

    orders.forEach(order => {
        const orderDate = new Date(order.date);
        const orderTotal = order.total || calculateOrderTotal(order.items || []);
        const monthKey = orderDate.toLocaleString('default', { month: 'short', year: 'numeric' });

        // Category Revenue
        if (order.items) {
            order.items.forEach(item => {
                categoryRevenue[item.category] = 
                    (categoryRevenue[item.category] || 0) + (item.price * item.quantity);
            });
        }

        // Monthly Revenue
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + orderTotal;
    });

    return { categoryRevenue, monthlyRevenue };
}

function renderRevenueBreakdown(breakdown) {
    const categoryBreakdownEl = document.getElementById('category-revenue-breakdown');
    const monthlyBreakdownEl = document.getElementById('monthly-revenue-breakdown');

    // Category Revenue Breakdown
    if (categoryBreakdownEl) {
        const categoryHTML = Object.entries(breakdown.categoryRevenue)
            .sort((a, b) => b[1] - a[1])
            .map(([category, revenue]) => `
                <div class="revenue-category-item">
                    <span>${category.charAt(0).toUpperCase() + category.slice(1)}</span>
                    <div class="revenue-bar" style="width: ${(revenue / Math.max(...Object.values(breakdown.categoryRevenue)) * 100)}%">
                        <span class="revenue-amount">₹${revenue.toFixed(2)}</span>
                    </div>
                </div>
            `).join('');
        
        categoryBreakdownEl.innerHTML = categoryHTML;
    }

    // Monthly Revenue Breakdown
    if (monthlyBreakdownEl) {
        const monthlyHTML = Object.entries(breakdown.monthlyRevenue)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]))
            .map(([month, revenue]) => `
                <div class="revenue-month-item">
                    <span>${month}</span>
                    <div class="revenue-bar" style="width: ${(revenue / Math.max(...Object.values(breakdown.monthlyRevenue)) * 100)}%">
                        <span class="revenue-amount">₹${revenue.toFixed(2)}</span>
                    </div>
                </div>
            `).join('');
        
        monthlyBreakdownEl.innerHTML = monthlyHTML;
    }
}

function generateAnalytics() {
    const adminOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]');
    const completedOrders = adminOrders.filter(order => order.status === 'Completed');

    // Daily Orders Chart
    const dailyOrdersCtx = document.getElementById('daily-orders-chart');
    if (dailyOrdersCtx) {
        const dailyOrders = getDailyOrdersData(completedOrders);
        new Chart(dailyOrdersCtx, {
            type: 'line',
            data: {
                labels: dailyOrders.labels,
                datasets: [{
                    label: 'Daily Orders',
                    data: dailyOrders.data,
                    borderColor: '#FF6B6B',
                    backgroundColor: 'rgba(255, 107, 107, 0.2)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // Top Selling Items Chart
    const topItemsCtx = document.getElementById('top-items-chart');
    if (topItemsCtx) {
        const topItems = getTopSellingItems(completedOrders);
        new Chart(topItemsCtx, {
            type: 'bar',
            data: {
                labels: topItems.labels,
                datasets: [{
                    label: 'Items Sold',
                    data: topItems.data,
                    backgroundColor: '#4ECDC4'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

function getDailyOrdersData(orders) {
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toDateString();
    }).reverse();

    const dailyOrderCounts = last7Days.map(date => 
        orders.filter(order => new Date(order.date).toDateString() === date).length
    );

    return {
        labels: last7Days.map(date => new Date(date).toLocaleDateString('default', { weekday: 'short' })),
        data: dailyOrderCounts
    };
}

function getTopSellingItems(orders) {
    const itemSales = {};
    orders.forEach(order => {
        if (order.items) {
            order.items.forEach(item => {
                itemSales[item.name] = (itemSales[item.name] || 0) + item.quantity;
            });
        }
    });

    const sortedItems = Object.entries(itemSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    return {
        labels: sortedItems.map(item => item[0]),
        data: sortedItems.map(item => item[1])
    };
}

// Food Search and Management
function loadFoodItems() {
    const foodTableBody = document.getElementById('food-table-body');
    
    const foodItems = [
            // Pizza Category
    {
        name: "Margherita Pizza",
        price: 299,
        image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500",
        category: "pizza"
    },
    {
        name: "Pepperoni Pizza",
        price: 399,
        image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500",
        category: "pizza"
    },
    {
        name: "BBQ Chicken Pizza",
        price: 449,
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500",
        category: "pizza"
    },
    {
        name: "Vegetarian Supreme",
        price: 379,
        image: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=500",
        category: "pizza"
    },
    {
        name: "Hawaiian Pizza",
        price: 399,
        image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=500",
        category: "pizza"
    },
    {
        name: "brazellian Pizza",
        price: 299,
        image: "https://tse1.mm.bing.net/th?id=OIP.Gbk1mKmzLE2tNpbhG12rUgHaE7&pid=Api&P=0&h=220",
        category: "pizza"
    },
    {
        name: "italian Pizza",
        price: 249,
        image: "https://tse4.mm.bing.net/th?id=OIP.wpw6lxlMqeqPjHL_A7vCmwHaEo&pid=Api&P=0&h=2200",
        category: "pizza"
    },
    {
        name: "Spicy Chicken Supreme",
        price: 429,
        image: "https://static.toiimg.com/thumb/53339084.cms?imgsize=85489&width=800&height=800",
        category: "pizza"
    },
    
    {
        name: "Truffle Mushroom Pizza",
        price: 419,
        image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=500",
        category: "pizza"
    },
    {
        name: "Pesto Chicken Pizza",
        price: 399,
        image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500",
        category: "pizza"
    },
    
    // Burger Category
    {
        name: "Classic Cheese Burger",
        price: 199,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
        category: "burger"
    },
    {
        name: "Double Chicken Burger",
        price: 299,
        image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500",
        category: "burger"
    },
    {
        name: "Veggie Supreme Burger",
        price: 179,
        image: "https://vegplatter.in/files/public/images/partner/catalog/71/veg%20burger%20with%20french%20fry.jpg",
        category: "burger"
    },
    {
        name: "Spicy Mexican Burger",
        price: 249,
        image: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=500",
        category: "burger"
    },
    {
        name: "BBQ Bacon Burger",
        price: 279,
        image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500",
        category: "burger"
    },
    
    // Drinks Category
    {
        name: "Mango Smoothie",
        price: 149,
        image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=500",
        category: "drinks"
    },
    {
        name: "Strawberry Milkshake",
        price: 129,
        image: "https://www.unicornsinthekitchen.com/wp-content/uploads/2018/08/Strawberry-Milkshake-square.jpg",
        category: "drinks"
    },
    {
        name: "Chocolate Shake",
        price: 139,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500",
        category: "drinks"
    },
    {
        name: "Fresh Lemonade",
        price: 99,
        image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=500",
        category: "drinks"
    },
    {
        name: "Iced Coffee",
        price: 159,
        image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500",
        category: "drinks"
    },
    
    // More Pizza Options
    {
        name: "Mushroom Pizza",
        price: 349,
        image: "https://images.eatsmarter.com/sites/default/files/styles/max_size/public/sliced-mushroom-pizza-507921.jpg",
        category: "pizza"
    },
    {
        name: "Four Cheese Pizza",
        price: 429,
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500",
        category: "pizza"
    },
    {
        name: "Four Cheese Delight",
        price: 389,
        image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500",
        category: "pizza"
    },
    {
        name: "Mediterranean Veggie",
        price: 359,
        image: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=500",
        category: "pizza"
    },
    {
        name: "Meat Lovers Pizza",
        price: 479,
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500",
        category: "pizza"
    },
    
    // More Burger Options
    {
        name: "Mushroom Swiss Burger",
        price: 259,
        image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500",
        category: "burger"
    },
    {
        name: "Crispy Chicken Burger",
        price: 229,
        image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=500",
        category: "burger"
    },
    
    // More Drinks Options
    {
        name: "Berry Blast Smoothie",
        price: 169,
        image: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=500",
        category: "drinks"
    },
    {
        name: "Mint Mojito",
        price: 179,
        image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=500",
        category: "drinks"
    },
    // Dinner Category
    {
        name: "Chicken Tandoori",
        price: 199,
        image: "https://media.istockphoto.com/id/1396604313/photo/roasted-whole-chicken-legs-with-condiment-directly-above-photo.webp?a=1&b=1&s=612x612&w=0&k=20&c=1D5tmeb0HGE2bT2yPtMwJlxVOrwpnWDcF0BNG27z_Qg=",
        category: "dinner"
    },
    {
        name: "Mutton Korma",
        price: 249,
        image: "https://media.istockphoto.com/id/608005280/photo/mutton-rogan-josh-mutton-curry-indian-cuisine.webp?a=1&b=1&s=612x612&w=0&k=20&c=uFGmI-oKVz90g80NRI833FMyl7CKmy7ToBNYAvuACNo=",
        category: "dinner"
    },
    {
        name: "Butter Chicken",
        price: 229,
        image: "https://media.istockphoto.com/id/639389404/photo/authentic-indian-food.webp?a=1&b=1&s=612x612&w=0&k=20&c=BIz-9inz1CdT5LkBOStg1LImZxPSAg5PyhCgFa4VqVc=",
        category: "dinner"
    },
    {
        name: "Paneer Tikka Masala",
        price: 199,
        image: "https://media.istockphoto.com/id/1474367315/photo/paneer-lababdar.webp?a=1&b=1&s=612x612&w=0&k=20&c=luYCIkWFDkVaHN3F6SB950FtpxQ9_ffwvU0vlPGoqH8=",
        category: "dinner"
    },
    {
        name: "Dal Makhani",
        price: 179,
        image: "https://media.istockphoto.com/id/531241066/photo/dal-makhani-or-dal-makhani-or-daal-makhni.webp?a=1&b=1&s=612x612&w=0&k=20&c=DgZxad4-2Q0II88BRi60BtfASi1bZYb8Xx6LBZZWmgY=",
        category: "dinner"
    },
    {
        name: "Lamb Biryani",
        price: 279,
        image: "https://media.istockphoto.com/id/1430345748/photo/biryani-overhead-view.webp?a=1&b=1&s=612x612&w=0&k=20&c=St2EEaWdaC6cLC6oSIV2wwo8taRRyta7H90NeYSWojc=",
        category: "dinner"
    },
    {
        name: "Vegetable Pulao",
        price: 159,
        image: "https://media.istockphoto.com/id/980135772/photo/indian-vegetable-pulav-or-biryani-made-using-basmati-rice-served-in-terracotta-bowl-selective.webp?a=1&b=1&s=612x612&w=0&k=20&c=QWr22yWn6PxXW7Cp1TYG8h1VnBy8Lrj3ElKIMiqQN1c=",
        category: "dinner"
    },
    {
        name: "Chicken Curry",
        price: 209,
        image: "https://media.istockphoto.com/id/1286704566/photo/image-of-turquoise-blue-cooking-pan-filled-with-butter-chicken-tikka-curry-large-chunks-of.webp?a=1&b=1&s=612x612&w=0&k=20&c=_UHYNHAOBxEoOrzqLgi3iRN9S03FrsKhDWPgubpSdg4=",
        category: "dinner"
    },
    {
        name: "Palak Paneer",
        price: 189,
        image: "https://media.istockphoto.com/id/2147564917/photo/palak-paneer-with-basmati-rice-and-salad.webp?a=1&b=1&s=612x612&w=0&k=20&c=lyvsWawZ2UNgtwRtW8C4F7Uj7h4jNobtAEDeP5whc48=",
        category: "dinner"
    },
    {
        name: "Sag Aloo",
        price: 169,
        image: "https://media.istockphoto.com/id/1987660013/photo/saag-aloo-is-a-classic-indian-style-side-dish-featuring-potatoes-fried-in-spices-and-spinach.webp?a=1&b=1&s=612x612&w=0&k=20&c=M_2taFK4WYVrAUVmWxWaPGc6vDUOngUWintpBkURYEk=",
        category: "dinner"
    },
    {
        name: "Chana Masala",
        price: 179,
        image: "https://media.istockphoto.com/id/615823422/photo/delicious-indian-chana-masala-and-puri-close-up-horizontal.webp?a=1&b=1&s=612x612&w=0&k=20&c=8X36x1kTIQosOkHauAeRQ3mSE9XK-lcSaGht0m3qvKg=",
        category: "dinner"
    },
    {
        name: "Rajma Masala",
        price: 189,
        image: "https://media.istockphoto.com/id/1497380655/photo/rajma-chawal-is-a-popular-north-indian-food-made-of-red-kidney-beans-cooked-with-onions.jpg?s=612x612&w=0&k=20&c=zTXDaCLkursOkBc_18wO6FGESOL9mMW7bZNPqSXMXaQ=",
        category: "dinner"
    },
    {
        name: "Samosas",
        price: 149,
        image: "https://media.istockphoto.com/id/980106992/photo/samosa-snack-served-with-tomato-ketchup-and-mint-chutney.webp?a=1&b=1&s=612x612&w=0&k=20&c=kLqY6RY-uvHPdGqExrUzas9n4V6GOgoa3XY7ApquWmM=",
        category: "dinner"
    },
    {
        name: "Korma Naan",
        price: 129,
        image: "https://media.istockphoto.com/id/1069231834/photo/rice-with-chicken-butter-sauce.webp?a=1&b=1&s=612x612&w=0&k=20&c=rrDAXeEVB62CCLld419vfmNrnYH1OJTvahUnaMJUAW8=",
        category: "dinner"
    },
    ];

    foodTableBody.innerHTML = foodItems.map(food => `
        <tr>
            <td><img src="${food.image}" alt="${food.name}" style="width: 50px; height: 50px;"></td>
            <td>${food.name}</td>
            <td>₹${food.price}</td>
            <td>${food.category}</td>
        </tr>
    `).join('');
}

function searchFoodItems() {
    const searchTerm = document.getElementById('food-search').value.toLowerCase();
    const rows = document.querySelectorAll('#food-table-body tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Enhance Add Food Item Function
document.getElementById('add-food-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const foodName = document.getElementById('food-name').value;
    const foodPrice = document.getElementById('food-price').value;
    const foodCategory = document.getElementById('food-category').value;
    const foodImage = document.getElementById('food-image').files[0];
    const foodDescription = document.getElementById('food-description').value;
    const foodPrepTime = document.getElementById('food-prep-time').value;
    const foodAvailability = document.getElementById('food-availability').value;
    const foodCalories = document.getElementById('food-calories').value;
    const foodAllergens = document.getElementById('food-allergens').value;

    const newFoodItem = {
        name: foodName,
        price: foodPrice,
        category: foodCategory,
        image: foodImage ? URL.createObjectURL(foodImage) : null,
        description: foodDescription,
        prepTime: foodPrepTime,
        availability: foodAvailability,
        calories: foodCalories,
        allergens: foodAllergens
    };

    console.log('New Food Item:', newFoodItem);

    // Reset form
    this.reset();
    
    // Reload food items to show the new item
    loadFoodItems();

    alert('Food item added successfully!');
});

// Notification Sound Functionality
const notificationSound = new Audio('sounds/notification.wav');

function playNotificationSound() {
    try {
        // Check if sound is not already playing
        if (notificationSound.paused) {
            notificationSound.play().catch(error => {
                console.warn('Unable to play notification sound:', error);
            });
        }
    } catch (error) {
        console.error('Error playing notification sound:', error);
    }
}

function showDesktopNotification(order) {
    // Request notification permission if not already granted
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }

    // Show desktop notification
    if (Notification.permission === 'granted') {
        new Notification('New Order Received', {
            body: `Order #${order.id} from ${order.customerName}\nTotal: ₹${order.totalPrice}`,
            icon: 'path/to/restaurant-icon.png'
        });
    }
}

// Update DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    showSection('welcome');
    loadUsers();
    loadOrders();
    loadFoodItems();
    updateWelcomeSectionStats();
    calculateRevenue();
    generateAnalytics();
    
    // Request notification permission on page load
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
});
