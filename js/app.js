// 预算跟踪工具 - 主要JavaScript功能

// 全局变量
let projectData = {
    name: '',
    startDate: '',
    endDate: '',
    initialBudget: 0,
    warningThreshold: 20
};

let transactions = [];
let budgetChart = null;
let budgetCategoryChart = null;
let actualCategoryChart = null;
let currentPage = 1;
let itemsPerPage = 20;
let filteredTransactions = [];

// 用户设置
let userSettings = {
    chartType: 'line',
    itemsPerPage: 20,
    filterType: 'all',
    filterRecordType: 'all',
    categoryChartType: 'expense'
};

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    // 加载保存的数据
    loadData();
    
    // 加载用户设置
    loadUserSettings();
    
    // 初始化事件监听器
    initEventListeners();
    
    // 更新预算状态显示
    updateBudgetSummary();
    
    // 初始化图表
    initChart();
    
    // 初始化分类占比图表
    initCategoryCharts();
    
    // 渲染交易记录表格
    renderTransactionsTable();
});

// 初始化事件监听器
function initEventListeners() {
    // 项目表单提交
    document.getElementById('project-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveProjectInfo();
    });
    
    // 交易表单提交
    document.getElementById('transaction-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addTransaction();
    });
    
    // 更新图表按钮
    document.getElementById('update-chart').addEventListener('click', function() {
        // 保存图表类型设置
        userSettings.chartType = document.getElementById('chart-type').value;
        saveUserSettings();
        updateChart();
    });
    
    // 图表类型变更时保存设置
    document.getElementById('chart-type').addEventListener('change', function() {
        userSettings.chartType = this.value;
        saveUserSettings();
    });
    
    // 分类图表类型变更时更新图表
    document.getElementById('category-chart-type').addEventListener('change', function() {
        updateCategoryCharts();
    });
    
    // 筛选类型变更时保存设置
    document.getElementById('filter-type').addEventListener('change', function() {
        userSettings.filterType = this.value;
        saveUserSettings();
        filterTransactions();
    });
    
    // 记录类型筛选变更时保存设置
    document.getElementById('filter-record-type').addEventListener('change', function() {
        userSettings.filterRecordType = this.value;
        saveUserSettings();
        filterTransactions();
    });
    
    // 重置图表缩放按钮
    document.getElementById('reset-zoom').addEventListener('click', function() {
        if (budgetChart && budgetChart.resetZoom) {
            budgetChart.resetZoom();
            // 重置后保存用户设置
            saveUserSettings();
        }
    });
    
    // 导入数据按钮
    document.getElementById('import-button').addEventListener('click', function() {
        importExcelData();
    });
    
    // 导出数据按钮
    document.getElementById('export-data').addEventListener('click', function() {
        exportToExcel();
    });
    
    // 导出JSON数据按钮
    document.getElementById('export-json').addEventListener('click', function() {
        exportToJSON();
    });
    
    // 导入JSON数据按钮
    document.getElementById('import-json').addEventListener('click', function() {
        importFromJSON();
    });
    
    // 交易记录搜索
    document.getElementById('search-transactions').addEventListener('input', function() {
        filterTransactions();
    });
    
    // 交易记录筛选
    document.getElementById('filter-type').addEventListener('change', function() {
        filterTransactions();
    });
    
    document.getElementById('filter-record-type').addEventListener('change', function() {
        filterTransactions();
    });
    
    // 分页按钮
    document.getElementById('prev-page').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderTransactionsTable();
        }
    });
    
    document.getElementById('next-page').addEventListener('click', function() {
        const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTransactionsTable();
        }
    });
    
    // 每页显示条数变更时保存设置
    document.getElementById('items-per-page').addEventListener('change', function() {
        itemsPerPage = parseInt(this.value);
        userSettings.itemsPerPage = itemsPerPage;
        saveUserSettings();
        currentPage = 1;
        filterTransactions();
    });
}

// 保存项目信息
function saveProjectInfo() {
    projectData.name = document.getElementById('project-name').value;
    projectData.startDate = document.getElementById('start-date').value;
    projectData.endDate = document.getElementById('end-date').value;
    projectData.initialBudget = parseFloat(document.getElementById('initial-budget').value);
    projectData.warningThreshold = parseInt(document.getElementById('warning-threshold').value);
    
    // 保存到本地存储
    saveData();
    
    // 更新预算状态显示
    updateBudgetSummary();
    
    // 更新图表
    updateChart();
    
    // 显示成功消息
    alert('项目信息已保存！');
}

// 添加交易记录
function addTransaction() {
    const transaction = {
        id: Date.now(), // 使用时间戳作为唯一ID
        date: document.getElementById('transaction-date').value,
        type: document.getElementById('transaction-type').value,
        recordType: document.getElementById('transaction-record-type').value, // 新增记录类型：实际或预算
        category: document.getElementById('transaction-category').value,
        amount: parseFloat(document.getElementById('transaction-amount').value),
        description: document.getElementById('transaction-description').value
    };
    
    // 添加到交易数组
    transactions.push(transaction);
    
    // 保存到本地存储
    saveData();
    
    // 更新预算状态显示
    updateBudgetSummary();
    
    // 更新图表
    updateChart();
    
    // 更新分类占比图表
    updateCategoryCharts();
    
    // 重新渲染交易表格
    renderTransactionsTable();
    
    // 重置表单
    document.getElementById('transaction-form').reset();
    
    // 设置默认日期为今天
    document.getElementById('transaction-date').valueAsDate = new Date();
    
    // 默认选择"实际"记录类型
    document.getElementById('transaction-record-type').value = 'actual';
}

// 删除交易记录
function deleteTransaction(id) {
    // 确认删除
    if (confirm('确定要删除这条交易记录吗？')) {
        // 从数组中移除
        transactions = transactions.filter(t => t.id !== id);
        
        // 保存到本地存储
        saveData();
        
        // 更新预算状态显示
        updateBudgetSummary();
        
        // 更新图表
        updateChart();
        
        // 更新分类占比图表
        updateCategoryCharts();
        
        // 重新渲染交易表格
        renderTransactionsTable();
    }
}

// 筛选交易记录
function filterTransactions() {
    const searchTerm = document.getElementById('search-transactions').value.toLowerCase();
    const filterType = document.getElementById('filter-type').value;
    const filterRecordType = document.getElementById('filter-record-type').value;
    
    // 重置当前页码
    currentPage = 1;
    
    // 筛选交易记录
    filteredTransactions = transactions.filter(transaction => {
        // 搜索条件
        const matchesSearch = 
            transaction.category.toLowerCase().includes(searchTerm) ||
            transaction.description.toLowerCase().includes(searchTerm);
        
        // 类型筛选
        const matchesType = filterType === 'all' || transaction.type === filterType;
        
        // 记录类型筛选
        const matchesRecordType = filterRecordType === 'all' || transaction.recordType === filterRecordType;
        
        return matchesSearch && matchesType && matchesRecordType;
    });
    
    // 更新表格
    renderTransactionsTable();
    
    // 更新分页信息
    updatePagination();
}

// 更新分页信息
function updatePagination() {
    const totalItems = filteredTransactions.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    document.getElementById('current-page').textContent = `${currentPage}/${totalPages || 1}`;
    document.getElementById('total-items').textContent = totalItems;
    
    // 禁用/启用分页按钮
    document.getElementById('prev-page').disabled = currentPage <= 1;
    document.getElementById('next-page').disabled = currentPage >= totalPages;
}

// 渲染交易记录表格
function renderTransactionsTable() {
    const tableBody = document.getElementById('transactions-table');
    tableBody.innerHTML = '';
    
    // 如果还没有筛选过，初始化筛选结果为所有交易
    if (filteredTransactions.length === 0 && transactions.length > 0) {
        filteredTransactions = [...transactions];
    }
    
    // 按日期排序（最新的在前面）
    const sortedTransactions = [...filteredTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 计算当前页的数据
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, sortedTransactions.length);
    const currentPageData = sortedTransactions.slice(startIndex, endIndex);
    
    // 更新分页信息
    updatePagination();
    
    currentPageData.forEach(transaction => {
        const row = document.createElement('tr');
        
        // 设置行的类，根据交易类型和记录类型
        if (transaction.type === 'expense') {
            row.classList.add('table-danger');
        } else {
            row.classList.add('table-success');
        }
        
        // 如果是预算记录，添加特殊样式
        if (transaction.recordType === 'budget') {
            row.classList.add('table-secondary');
        }
        
        // 格式化日期
        const dateObj = new Date(transaction.date);
        const formattedDate = dateObj.toLocaleDateString('zh-CN');
        
        // 格式化金额
        const formattedAmount = transaction.amount.toFixed(2);
        
        // 设置单元格内容
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${transaction.type === 'expense' ? '支出' : '收入'}</td>
            <td>${transaction.recordType === 'actual' ? '实际' : '预算'}</td>
            <td>${transaction.category}</td>
            <td>¥${formattedAmount}</td>
            <td>${transaction.description || '-'}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteTransaction(${transaction.id})" title="删除交易记录">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // 如果没有交易记录，显示提示
    if (currentPageData.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="7" class="text-center">暂无交易记录</td>';
        tableBody.appendChild(emptyRow);
    }
}

// 此函数已被移除，预算设置功能已合并到addTransaction函数中

// 更新预算状态摘要
function updateBudgetSummary() {
    // 计算实际总支出和总收入
    const totalExpenses = transactions
        .filter(t => t.type === 'expense' && t.recordType === 'actual')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalIncome = transactions
        .filter(t => t.type === 'income' && t.recordType === 'actual')
        .reduce((sum, t) => sum + t.amount, 0);
    
    // 计算计划预算总额
    const totalPlannedIncome = transactions
        .filter(t => t.type === 'income' && t.recordType === 'budget')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalPlannedExpense = transactions
        .filter(t => t.type === 'expense' && t.recordType === 'budget')
        .reduce((sum, t) => sum + t.amount, 0);
    
    // 计算当前剩余预算（初始预算 - 实际支出 + 实际收入）
    const initialBudget = projectData.initialBudget;
    // 实际预算只受实际收支影响
    const remainingBudget = initialBudget - totalExpenses + totalIncome;
    const usedBudget = totalExpenses - totalIncome;
    
    // 修复使用比例计算 - 使用实际使用/初始预算
    const usagePercentage = initialBudget > 0 ? (usedBudget / initialBudget) * 100 : 0;
    
    // 更新显示
    document.getElementById('summary-initial').textContent = `¥${initialBudget.toFixed(2)}`;
    document.getElementById('summary-remaining').textContent = `¥${remainingBudget.toFixed(2)}`;
    document.getElementById('summary-used').textContent = `¥${usedBudget.toFixed(2)}`;
    document.getElementById('summary-percentage').textContent = `${Math.min(100, Math.max(0, usagePercentage)).toFixed(1)}%`;
    
    // 更新进度条
    const progressBar = document.getElementById('budget-progress');
    progressBar.style.width = `${Math.min(100, Math.max(0, usagePercentage))}%`;
    
    // 根据使用比例设置进度条颜色
    if (usagePercentage >= 100) {
        progressBar.className = 'progress-bar bg-danger';
    } else if (usagePercentage >= (100 - projectData.warningThreshold)) {
        progressBar.className = 'progress-bar bg-warning';
    } else {
        progressBar.className = 'progress-bar bg-success';
    }
    
    // 显示计划预算信息
    const adjustmentInfo = document.getElementById('budget-settings-info');
    if (totalPlannedIncome > 0 || totalPlannedExpense > 0) {
        let adjustmentText = '计划预算: ';
        if (totalPlannedIncome > 0) {
            adjustmentText += `计划收入 ¥${totalPlannedIncome.toFixed(2)} `;
        }
        if (totalPlannedExpense > 0) {
            adjustmentText += `计划支出 ¥${totalPlannedExpense.toFixed(2)}`;
        }
        adjustmentInfo.textContent = adjustmentText;
        adjustmentInfo.classList.remove('d-none');
    } else {
        adjustmentInfo.classList.add('d-none');
    }
    
    // 显示或隐藏警告消息
    const warningMessage = document.getElementById('warning-message');
    const warningText = document.getElementById('warning-text');
    
    if (remainingBudget <= 0) {
        warningMessage.classList.remove('d-none');
        warningText.textContent = '预算已用完！请减少支出或增加收入。';
    } else if (usagePercentage >= (100 - projectData.warningThreshold)) {
        warningMessage.classList.remove('d-none');
        
        // 计算预计用完日期
        if (projectData.startDate && projectData.endDate && usedBudget > 0) {
            const startDate = new Date(projectData.startDate);
            const endDate = new Date(projectData.endDate);
            const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            const elapsedDays = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24));
            
            // 计算每天平均消耗
            const dailyUsage = usedBudget / Math.max(1, elapsedDays);
            
            // 计算预计用完日期
            const daysUntilEmpty = Math.floor(remainingBudget / dailyUsage);
            const emptyDate = new Date();
            emptyDate.setDate(emptyDate.getDate() + daysUntilEmpty);
            
            warningText.textContent = `预警：预算剩余 ${(remainingBudget / initialBudget * 100).toFixed(1)}%，按当前消耗速度，预计将在 ${emptyDate.toLocaleDateString('zh-CN')} 用完预算。实际支出已超过计划预算 ${(usagePercentage - 100).toFixed(1)}%。`;
        } else {
            warningText.textContent = `预警：预算剩余 ${(remainingBudget / initialBudget * 100).toFixed(1)}%，低于预警阈值 ${projectData.warningThreshold}%。实际支出与计划预算的比例为 ${usagePercentage.toFixed(1)}%。`;
        }
    } else {
        warningMessage.classList.add('d-none');
    }
}

// 初始化图表
function initChart() {
    const ctx = document.getElementById('budget-chart').getContext('2d');
    
    // 创建新图表 - 如果是area类型，使用line类型并设置fill属性
    const chartType = userSettings.chartType || 'line';
    const isAreaChart = chartType === 'area';
    
    budgetChart = new Chart(ctx, {
        type: isAreaChart ? 'line' : chartType, // area类型转换为line类型
        data: {
            labels: [],
            datasets: [
                {
                    label: '计划预算',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderWidth: 2,
                    fill: isAreaChart ? 'origin' : false, // 正确设置面积图填充
                    data: []
                },
                {
                    label: '实际剩余',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderWidth: 2,
                    fill: isAreaChart ? 'origin' : false, // 正确设置面积图填充
                    data: []
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '日期'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '金额 (¥)'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += '¥' + context.parsed.y.toFixed(2);
                            }
                            
                            // 计算偏差值（计划预算 - 实际剩余）
                            const datasetIndex = context.datasetIndex;
                            const dataIndex = context.dataIndex;
                            
                            // 确保有两个数据集且当前点有对应的另一个数据集的值
                            if (context.chart.data.datasets.length >= 2 && 
                                dataIndex < context.chart.data.datasets[0].data.length && 
                                dataIndex < context.chart.data.datasets[1].data.length) {
                                
                                const plannedValue = context.chart.data.datasets[0].data[dataIndex];
                                const actualValue = context.chart.data.datasets[1].data[dataIndex];
                                
                                if (plannedValue !== null && actualValue !== null) {
                                    const difference = plannedValue - actualValue;
                                    const differenceLabel = '偏差: ' + (difference >= 0 ? '+' : '') + 
                                                          '¥' + difference.toFixed(2) + 
                                                          (difference > 0 ? ' (超支)' : difference < 0 ? ' (节余)' : '');
                                    
                                    return [label, differenceLabel];
                                }
                            }
                            
                            return label;
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'xy',
                        threshold: 10, // 增加阈值以减少误触发
                        modifierKey: null, // 设置为null允许直接拖动，不需要按住修饰键
                        onPanStart: function() {
                            // 开始平移时改变光标
                            document.body.style.cursor = 'grab';
                        },
                        onPan: function() {
                            // 平移时实时更新
                            document.body.style.cursor = 'grabbing';
                        },
                        onPanComplete: function() {
                            // 平移完成后保存用户设置
                            document.body.style.cursor = 'default';
                            saveUserSettings();
                        }
                    },
                    // 移除drag配置，避免与pan功能冲突

                    zoom: {
                        wheel: {
                            enabled: true,
                            speed: 0.1 // 降低缩放速度，使缩放更平滑
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'xy',
                        onZoomComplete: function() {
                            // 保存缩放状态到用户设置
                            saveUserSettings();
                        }
                    },
                    limits: {
                        x: {min: 'original', max: 'original', minRange: 1},
                        y: {min: 'original', max: 'original', minRange: 1}
                    }
                }
            }
        }
    });
    
    // 设置图表类型选择器的值为保存的设置
    document.getElementById('chart-type').value = userSettings.chartType || 'line';
    
    // 初始更新图表
    updateChart();
}

// 更新图表
function updateChart() {
    if (!budgetChart || !projectData.startDate || !projectData.endDate) return;
    
    // 获取图表类型
    let chartType = document.getElementById('chart-type').value;
    const isAreaChart = chartType === 'area';
    
    // 如果是area类型，转换为line类型并在后续设置fill属性
    if (isAreaChart) {
        chartType = 'line';
    }
    
    // 更新图表类型
    budgetChart.config.type = chartType;
    
    // 如果是面积图，设置fill属性为'origin'以正确显示面积图
    budgetChart.data.datasets.forEach(dataset => {
        dataset.fill = isAreaChart ? 'origin' : false;
    });
    
    // 确保图表更新以应用fill设置
    budgetChart.update();
    
    // 不直接设置图表类型，而是在后面根据类型分别处理
    // 避免设置不支持的图表类型如'area'
    
    // 重置缩放
    if (budgetChart.resetZoom) {
        budgetChart.resetZoom();
    }
    
    // 生成日期范围
    const startDate = new Date(projectData.startDate);
    const endDate = new Date(projectData.endDate);
    const dateLabels = [];
    const plannedBudgetData = [];
    const actualSpendingData = [];
    
    // 计算项目总天数
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // 获取计划预算使用方式（不再默认线性减少）
    // 这里我们允许用户设置自定义的预算使用方式，而不是默认线性减少到0
    // 目前简单实现为保持预算不变，后续可以扩展为更复杂的预算规划
    
    // 计算计划预算总额
    const chartPlannedIncome = transactions
        .filter(t => t.type === 'income' && t.recordType === 'budget')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const chartPlannedExpense = transactions
        .filter(t => t.type === 'expense' && t.recordType === 'budget')
        .reduce((sum, t) => sum + t.amount, 0);
    
    // 计算计划净预算（初始预算+计划收入-计划支出）
    const plannedNetBudget = projectData.initialBudget + chartPlannedIncome - chartPlannedExpense;
    
    // 生成每一天的数据
    let currentDate = new Date(startDate);
    let remainingPlannedBudget = plannedNetBudget;
    let actualBudget = projectData.initialBudget;
    
    while (currentDate <= endDate) {
        // 格式化日期为 MM-DD 格式
        const formattedDate = `${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
        dateLabels.push(formattedDate);
        
        // 计算该日期的计划预算
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // 找出该日期之前（含当天）的所有预算交易
        const relevantBudgetTransactions = transactions.filter(t => t.date <= dateStr && t.recordType === 'budget');
        
        // 计算预算支出和预算收入
        const budgetExpenses = relevantBudgetTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const budgetIncome = relevantBudgetTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        // 计算计划剩余预算
        const plannedBudget = projectData.initialBudget - budgetExpenses + budgetIncome;
        plannedBudgetData.push(plannedBudget >= 0 ? plannedBudget : 0);
        
        // 找出该日期之前（含当天）的所有实际交易
        const relevantActualTransactions = transactions.filter(t => t.date <= dateStr && t.recordType === 'actual');
        
        // 计算实际支出和实际收入
        const actualExpenses = relevantActualTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const actualIncome = relevantActualTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        // 计算实际剩余预算
        actualBudget = projectData.initialBudget - actualExpenses + actualIncome;
        actualSpendingData.push(actualBudget >= 0 ? actualBudget : 0);
        
        // 移动到下一天
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 更新图表数据
    budgetChart.data.labels = dateLabels;
    budgetChart.data.datasets[0].data = plannedBudgetData;
    budgetChart.data.datasets[1].data = actualSpendingData;
    
    // 根据图表类型调整样式
    // 销毁并重新创建图表以避免类型错误
    const ctx = document.getElementById('budget-chart').getContext('2d');
    budgetChart.destroy();
    
    // 创建数据集配置
    const datasets = [
        {
            label: '计划预算',
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderWidth: 2,
            data: plannedBudgetData,
            // 如果是area类型，设置fill为origin来模拟面积图效果
            fill: isAreaChart ? 'origin' : false
        },
        {
            label: '实际剩余',
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderWidth: 2,
            data: actualSpendingData,
            // 如果是area类型，设置fill为origin来模拟面积图效果
            fill: isAreaChart ? 'origin' : false
        }
    ];
    
    // 创建新图表 - 如果是area类型，使用line类型并设置fill属性
    // 保存原始options的深拷贝，避免引用问题
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                title: {
                    display: true,
                    text: '日期'
                }
            },
            y: {
                title: {
                    display: true,
                    text: '金额 (¥)'
                },
                beginAtZero: true
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += '¥' + context.parsed.y.toFixed(2);
                        }
                        
                        // 计算偏差值（计划预算 - 实际剩余）
                        const datasetIndex = context.datasetIndex;
                        const dataIndex = context.dataIndex;
                        
                        // 确保有两个数据集且当前点有对应的另一个数据集的值
                        if (context.chart.data.datasets.length >= 2 && 
                            dataIndex < context.chart.data.datasets[0].data.length && 
                            dataIndex < context.chart.data.datasets[1].data.length) {
                            
                            const plannedValue = context.chart.data.datasets[0].data[dataIndex];
                            const actualValue = context.chart.data.datasets[1].data[dataIndex];
                            
                            if (plannedValue !== null && actualValue !== null) {
                                const difference = plannedValue - actualValue;
                                const differenceLabel = '偏差: ' + (difference >= 0 ? '+' : '') + 
                                                      '¥' + difference.toFixed(2) + 
                                                      (difference > 0 ? ' (超支)' : difference < 0 ? ' (节余)' : '');
                                
                                return [label, differenceLabel];
                            }
                        }
                        
                        return label;
                    }
                }
            },
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'xy',
                    // 使用更兼容的配置方式
                    modifierKey: null,
                    // 完全移除threshold参数，使用默认值
                    // 添加overScaleMode参数以增强兼容性
                    overScaleMode: 'xy',
                    onPanComplete: function(context) {
                        // 确保平移后zoom功能仍然启用
                        if (context && context.chart && context.chart.options.plugins.zoom) {
                            context.chart.options.plugins.zoom.zoom.wheel.enabled = true;
                        }
                        // 平移完成后保存用户设置
                        saveUserSettings();
                    }
                },
                zoom: {
                    wheel: {
                        enabled: true,
                        speed: 0.1 // 降低缩放速度，使缩放更平滑
                    },
                    pinch: {
                        enabled: true
                    },
                    mode: 'xy',
                    onZoomComplete: function(context) {
                        // 确保缩放后pan功能仍然启用
                        if (context.chart.options.plugins.zoom) {
                            context.chart.options.plugins.zoom.pan.enabled = true;
                        }
                        // 保存缩放状态到用户设置
                        saveUserSettings();
                    }
                },
                limits: {
                    x: {min: 'original', max: 'original', minRange: 1},
                    y: {min: 'original', max: 'original', minRange: 1}
                }
            }
        }
    };
    
    budgetChart = new Chart(ctx, {
        // area类型不存在，使用line类型代替
        type: isAreaChart ? 'line' : chartType,
        data: {
            labels: dateLabels,
            datasets: datasets
        },
        options: chartOptions
    });
    
    // 确保缩放和平移功能正确启用
    if (budgetChart.options.plugins && budgetChart.options.plugins.zoom) {
        budgetChart.options.plugins.zoom.pan.enabled = true;
        budgetChart.options.plugins.zoom.zoom.wheel.enabled = true;
        budgetChart.update();
    }
    
    // 已经更新图表，直接返回
    return;

}

// 导入Excel数据
function importExcelData() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('请选择Excel文件');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // 假设数据在第一个工作表
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
            alert('Excel文件中没有数据');
            return;
        }
        
        // 验证数据格式
        const requiredFields = ['日期', '类型', '类别', '金额', '记录类型'];
        const firstRow = jsonData[0];
        
        const missingFields = requiredFields.filter(field => !(field in firstRow));
        if (missingFields.length > 0) {
            alert(`Excel文件缺少必要的列: ${missingFields.join(', ')}`);
            return;
        }
        
        // 处理导入的数据
        let importCount = 0;
        let errorCount = 0;
        
        jsonData.forEach(row => {
            try {
                // 验证日期格式
                let transactionDate;
                if (typeof row['日期'] === 'string') {
                    // 尝试解析日期字符串（格式可能是 YYYY-MM-DD 或 YYYY/MM/DD）
                    const dateParts = row['日期'].split(/[-\/]/);
                    if (dateParts.length === 3) {
                        transactionDate = `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`;
                    } else {
                        throw new Error('日期格式无效');
                    }
                } else if (typeof row['日期'] === 'number') {
                    // Excel日期是从1900年1月1日开始的天数
                    const excelDate = new Date(Math.round((row['日期'] - 25569) * 86400 * 1000));
                    transactionDate = excelDate.toISOString().split('T')[0];
                } else {
                    throw new Error('日期格式无效');
                }
                
                // 验证类型
                let transactionType;
                if (row['类型'] === '支出' || row['类型'].toLowerCase() === 'expense') {
                    transactionType = 'expense';
                } else if (row['类型'] === '收入' || row['类型'].toLowerCase() === 'income') {
                    transactionType = 'income';
                } else {
                    throw new Error('类型必须是「支出」或「收入」');
                }
                
                // 验证记录类型
                let recordType = 'actual'; // 默认为实际记录
                if (row['记录类型']) {
                    if (row['记录类型'] === '预算' || row['记录类型'].toLowerCase() === 'budget') {
                        recordType = 'budget';
                    } else if (row['记录类型'] === '实际' || row['记录类型'].toLowerCase() === 'actual') {
                        recordType = 'actual';
                    }
                }
                
                // 验证金额
                const amount = parseFloat(row['金额']);
                if (isNaN(amount) || amount <= 0) {
                    throw new Error('金额必须是大于0的数字');
                }
                
                // 创建交易记录
                const transaction = {
                    id: Date.now() + importCount, // 使用时间戳+计数器作为唯一ID
                    date: transactionDate,
                    type: transactionType,
                    recordType: recordType,
                    category: row['类别'] || '其他',
                    amount: amount,
                    description: row['描述'] || ''
                };
                
                // 添加到交易数组
                transactions.push(transaction);
                importCount++;
                
            } catch (error) {
                console.error('导入行错误:', error, row);
                errorCount++;
            }
        });
        
        // 保存到本地存储
        saveData();
        
        // 更新预算状态显示
        updateBudgetSummary();
        
        // 更新图表
        updateChart();
        
        // 重新渲染交易表格
        renderTransactionsTable();
        
        // 重置文件输入
        fileInput.value = '';
        
        // 显示导入结果
        alert(`导入完成！成功导入 ${importCount} 条记录，失败 ${errorCount} 条。`);
    };
    
    reader.onerror = function() {
        alert('读取文件时发生错误');
    };
    
    reader.readAsArrayBuffer(file);
}

// 导出数据到Excel
function exportToExcel() {
    // 如果没有交易记录，显示提示
    if (transactions.length === 0) {
        alert('没有交易记录可导出');
        return;
    }
    
    // 准备导出数据
    const exportData = transactions.map(t => ({
        '日期': new Date(t.date).toLocaleDateString('zh-CN'),
        '类型': t.type === 'expense' ? '支出' : '收入',
        '记录类型': t.recordType === 'actual' ? '实际' : '预算',
        '类别': t.category,
        '金额': t.amount,
        '描述': t.description || ''
    }));
    
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '交易记录');
    
    // 生成文件名
    const fileName = `${projectData.name || '预算跟踪'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    try {
        // 使用FileSaver.js导出Excel文件，而不是直接使用XLSX.writeFile
        // 这样可以解决某些环境下文件无法打开的问题
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        saveAs(blob, fileName);
    } catch (error) {
        console.error('导出Excel时发生错误:', error);
        alert('导出Excel时发生错误，请稍后再试');
    }
}

// 保存数据到本地存储
function saveData() {
    localStorage.setItem('budgetTracker_projectData', JSON.stringify(projectData));
    localStorage.setItem('budgetTracker_transactions', JSON.stringify(transactions));
}

// 从本地存储加载数据
function loadData() {
    const savedProjectData = localStorage.getItem('budgetTracker_projectData');
    const savedTransactions = localStorage.getItem('budgetTracker_transactions');
    
    if (savedProjectData) {
        projectData = JSON.parse(savedProjectData);
        
        // 填充表单
        document.getElementById('project-name').value = projectData.name || '';
        document.getElementById('start-date').value = projectData.startDate || '';
        document.getElementById('end-date').value = projectData.endDate || '';
        document.getElementById('initial-budget').value = projectData.initialBudget || 0;
        document.getElementById('warning-threshold').value = projectData.warningThreshold || 20;
    }
    
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
        
        // 兼容旧数据：如果交易记录中没有recordType字段，添加默认值'actual'
        transactions.forEach(transaction => {
            if (!transaction.hasOwnProperty('recordType')) {
                transaction.recordType = 'actual';
            }
        });
        
        // 初始化筛选后的交易记录
        filteredTransactions = [...transactions];
    }
    
    // 设置交易表单的默认日期为今天
    document.getElementById('transaction-date').valueAsDate = new Date();
}

// 导出数据到JSON文件
function exportToJSON() {
    try {
        // 创建包含所有数据的对象
        const exportData = {
            projectData: projectData,
            transactions: transactions,
            userSettings: userSettings,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        // 转换为JSON字符串
        const jsonString = JSON.stringify(exportData, null, 2);
        
        // 创建Blob对象
        const blob = new Blob([jsonString], {type: 'application/json'});
        
        // 生成文件名（使用项目名称和当前日期）
        const fileName = `${projectData.name || 'budget-tracker'}_${new Date().toISOString().split('T')[0]}.json`;
        
        // 使用FileSaver.js保存文件
        saveAs(blob, fileName);
        
        alert('数据已成功导出到JSON文件！');
    } catch (error) {
        console.error('导出JSON时发生错误:', error);
        alert('导出JSON时发生错误，请稍后再试');
    }
}

// 从JSON文件导入数据
function importFromJSON() {
    // 创建一个隐藏的文件输入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    // 监听文件选择事件
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) {
            document.body.removeChild(fileInput);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                // 解析JSON数据
                const importedData = JSON.parse(event.target.result);
                
                // 验证导入的数据格式
                if (!importedData.projectData || !importedData.transactions) {
                    throw new Error('无效的数据格式');
                }
                
                // 确认是否覆盖当前数据
                if (confirm('导入将覆盖当前所有数据，确定要继续吗？')) {
                    // 更新项目数据
                    projectData = importedData.projectData;
                    
                    // 更新交易记录
                    transactions = importedData.transactions;
                    
                    // 可选：更新用户设置
                    if (importedData.userSettings) {
                        userSettings = importedData.userSettings;
                    }
                    
                    // 保存到本地存储
                    saveData();
                    saveUserSettings();
                    
                    // 重新加载页面以应用所有更改
                    alert('数据导入成功！页面将刷新以应用更改。');
                    window.location.reload();
                }
            } catch (error) {
                console.error('导入JSON时发生错误:', error);
                alert('导入JSON时发生错误：' + error.message);
            }
            
            // 移除临时文件输入元素
            document.body.removeChild(fileInput);
        };
        
        reader.onerror = function() {
            alert('读取文件时发生错误');
            document.body.removeChild(fileInput);
        };
        
        // 读取文件内容
        reader.readAsText(file);
    });
    
    // 触发文件选择对话框
    fileInput.click();
}

// 保存用户设置到本地存储
function saveUserSettings() {
    // 确保保存当前的图表状态
    if (budgetChart) {
        // Chart.js zoom插件没有直接提供获取缩放级别的方法
        // 我们保存图表的当前状态，但不尝试保存具体的缩放级别
        userSettings.chartZoomState = {
            saved: true
            // 实际的缩放状态由Chart.js内部管理
        };
    }
    
    // 确保保存当前的筛选状态
    userSettings.filterType = document.getElementById('filter-type').value;
    userSettings.filterRecordType = document.getElementById('filter-record-type').value;
    userSettings.itemsPerPage = parseInt(document.getElementById('items-per-page').value);
    userSettings.chartType = document.getElementById('chart-type').value;
    
    // 保存分类图表类型
    if (document.getElementById('category-chart-type')) {
        userSettings.categoryChartType = document.getElementById('category-chart-type').value;
    }
    
    // 保存搜索关键词
    userSettings.searchTerm = document.getElementById('search-transactions').value;
    
    // 保存当前页码
    userSettings.currentPage = currentPage;
    
    // 保存到localStorage
    localStorage.setItem('budgetTracker_userSettings', JSON.stringify(userSettings));
    
    console.log('用户设置已保存', userSettings);
}

// 初始化分类占比图表
function initCategoryCharts() {
    // 获取预算分类图表的上下文
    const budgetCtx = document.getElementById('budget-category-chart').getContext('2d');
    // 获取实际分类图表的上下文
    const actualCtx = document.getElementById('actual-category-chart').getContext('2d');
    
    // 初始化预算分类图表
    budgetCategoryChart = new Chart(budgetCtx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(199, 199, 199, 0.7)',
                    'rgba(83, 102, 255, 0.7)',
                    'rgba(40, 159, 64, 0.7)',
                    'rgba(210, 199, 199, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(199, 199, 199, 1)',
                    'rgba(83, 102, 255, 1)',
                    'rgba(40, 159, 64, 1)',
                    'rgba(210, 199, 199, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ¥${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // 初始化实际分类图表
    actualCategoryChart = new Chart(actualCtx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(199, 199, 199, 0.7)',
                    'rgba(83, 102, 255, 0.7)',
                    'rgba(40, 159, 64, 0.7)',
                    'rgba(210, 199, 199, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(199, 199, 199, 1)',
                    'rgba(83, 102, 255, 1)',
                    'rgba(40, 159, 64, 1)',
                    'rgba(210, 199, 199, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ¥${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // 初始化时更新图表数据
    updateCategoryCharts();
}

// 更新分类占比图表
function updateCategoryCharts() {
    // 获取当前选择的图表类型（支出或收入）
    const chartType = document.getElementById('category-chart-type').value;
    userSettings.categoryChartType = chartType;
    saveUserSettings();
    
    // 按类别分组交易数据
    const budgetCategories = {};
    const actualCategories = {};
    
    // 筛选符合条件的交易记录
    transactions.filter(t => t.type === chartType).forEach(transaction => {
        const category = transaction.category;
        
        // 按记录类型分组
        if (transaction.recordType === 'budget') {
            if (!budgetCategories[category]) {
                budgetCategories[category] = 0;
            }
            budgetCategories[category] += transaction.amount;
        } else { // actual
            if (!actualCategories[category]) {
                actualCategories[category] = 0;
            }
            actualCategories[category] += transaction.amount;
        }
    });
    
    // 准备预算图表数据
    const budgetLabels = Object.keys(budgetCategories);
    const budgetData = budgetLabels.map(category => budgetCategories[category]);
    
    // 准备实际图表数据
    const actualLabels = Object.keys(actualCategories);
    const actualData = actualLabels.map(category => actualCategories[category]);
    
    // 更新预算分类图表
    budgetCategoryChart.data.labels = budgetLabels;
    budgetCategoryChart.data.datasets[0].data = budgetData;
    budgetCategoryChart.update();
    
    // 更新实际分类图表
    actualCategoryChart.data.labels = actualLabels;
    actualCategoryChart.data.datasets[0].data = actualData;
    actualCategoryChart.update();
}

// 从本地存储加载用户设置
function loadUserSettings() {
    const savedSettings = localStorage.getItem('budgetTracker_userSettings');
    
    if (savedSettings) {
        userSettings = JSON.parse(savedSettings);
        
        // 应用保存的设置
        if (userSettings.itemsPerPage) {
            itemsPerPage = userSettings.itemsPerPage;
            const itemsPerPageSelect = document.getElementById('items-per-page');
            if (itemsPerPageSelect) {
                itemsPerPageSelect.value = itemsPerPage.toString();
            }
        }
        
        // 应用图表类型设置
        if (userSettings.chartType) {
            // 修复：如果保存的是'area'类型，转换为'line'类型
            if (userSettings.chartType === 'area') {
                userSettings.chartType = 'line';
                // 在initChart函数中会设置fill属性
            }
            const chartTypeSelect = document.getElementById('chart-type');
            if (chartTypeSelect) {
                chartTypeSelect.value = userSettings.chartType;
            }
        }
        
        // 应用筛选类型设置
        if (userSettings.filterType) {
            const filterTypeSelect = document.getElementById('filter-type');
            if (filterTypeSelect) {
                filterTypeSelect.value = userSettings.filterType;
            }
        }
        
        // 应用记录类型筛选设置
        if (userSettings.filterRecordType) {
            const filterRecordTypeSelect = document.getElementById('filter-record-type');
            if (filterRecordTypeSelect) {
                filterRecordTypeSelect.value = userSettings.filterRecordType;
            }
        }
        
        // 应用搜索关键词
        if (userSettings.searchTerm) {
            const searchInput = document.getElementById('search-transactions');
            if (searchInput) {
                searchInput.value = userSettings.searchTerm;
            }
        }
        
        // 应用分类图表类型设置
        if (userSettings.categoryChartType) {
            const categoryChartTypeSelect = document.getElementById('category-chart-type');
            if (categoryChartTypeSelect) {
                categoryChartTypeSelect.value = userSettings.categoryChartType;
            }
        }
        
        // 恢复当前页码
        if (userSettings.currentPage) {
            currentPage = userSettings.currentPage;
        }
        
        console.log('用户设置已加载', userSettings);
    }
    
    // 初始化后立即应用筛选
    filterTransactions();
}