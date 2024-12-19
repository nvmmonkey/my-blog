---
sidebar_position: 3
---

# 🔧 Tmux Session 多个IP调用

> 这篇文章记录了如何在自动调用按键和前端控制的dApps ⚠️

## 1. Chrome Dev-tools

```sh
#Chrome打开Devtool
#打开Console
```

## 2.粘贴代码到Console | Paste in Console

```js
const simulateMouseClick = (element) => {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    ['mousedown', 'mouseup', 'click'].forEach(eventType => {
        element.dispatchEvent(new MouseEvent(eventType, {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y
        }));
    });
};

const simulateKeyPress = (input, key) => {
    input.dispatchEvent(new KeyboardEvent('keydown', {
        key: key,
        code: `Digit${key}`,
        keyCode: key.charCodeAt(0),
        which: key.charCodeAt(0),
        bubbles: true,
        cancelable: true
    }));

    // Update value to reflect key press
    input.value = input.value + key;
    input.dispatchEvent(new Event('input', { bubbles: true }));
};

const simulateDelete = (input) => {
    input.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Delete',
        code: 'Delete',
        keyCode: 46,
        bubbles: true
    }));

    // Remove last character
    input.value = input.value.slice(0, -1);
    input.dispatchEvent(new Event('input', { bubbles: true }));
};

const simulateKeyW = (input) => {
    input.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'w',
        code: 'KeyW',
        keyCode: 87,
        bubbles: true
    }));
    
    input.value = input.value + 'w';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    
    setTimeout(() => {
        input.value = input.value.slice(0, -1);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }, 200);
};

// New function to protect input value
const protectInputValue = (input) => {
    // Store the desired value
    const desiredValue = '0.101';
    
    // Override setter methods to prevent unwanted changes
    const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    
    Object.defineProperty(input, 'value', {
        get: originalDescriptor.get,
        set: function(newValue) {
            // Only allow specific values or empty string
            if (newValue === '' || newValue === desiredValue) {
                originalDescriptor.set.call(this, newValue);
            } else {
                // Revert to the desired value if an unwanted change is attempted
                console.log('Blocked input value change:', newValue);
                originalDescriptor.set.call(this, desiredValue);
                this.dispatchEvent(new Event('input', { bubbles: true }));
            }
        },
        configurable: true
    });

    // Prevent form from resetting
    const form = input.closest('form');
    if (form) {
        form.addEventListener('reset', (e) => {
            e.preventDefault();
            input.value = desiredValue;
        }, true);
    }

    // Intercept and block value mutations
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                if (input.value !== desiredValue) {
                    input.value = desiredValue;
                }
            }
        });
    });

    observer.observe(input, { 
        attributes: true, 
        attributeFilter: ['value']
    });

    // Protect against React-like frameworks that might try to change the value
    const originalAddEventListener = input.addEventListener;
    input.addEventListener = function(type, listener, options) {
        if (type === 'input') {
            const wrappedListener = (event) => {
                // Ensure value stays constant
                if (input.value !== desiredValue) {
                    input.value = desiredValue;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
                return listener.call(this, event);
            };
            originalAddEventListener.call(this, type, wrappedListener, options);
        } else {
            originalAddEventListener.call(this, type, listener, options);
        }
    };
};

const checkAndUpdateInput = () => {
    const input = document.querySelector('input[placeholder="0"]');
    const depositButton = Array.from(document.querySelectorAll('button'))
        .find(button => button.textContent.toLowerCase().includes('stake'));
    
    if (input && depositButton) {
        // Protect input value on first encounter
        if (!input.valueProtected) {
            protectInputValue(input);
            input.valueProtected = true;
        }

        const isDisabled = depositButton.disabled || depositButton.classList.contains('disabled');
        
        simulateMouseClick(input);
        input.focus();

        if (isDisabled) {
            // Try refreshing with 'w'
            simulateKeyW(input);
            
            setTimeout(() => {
                // Clear any existing value
                input.value = '';
                input.dispatchEvent(new Event('input', { bubbles: true }));
                
                // Simulate typing 0.101
                simulateKeyPress(input, '0');
                simulateKeyPress(input, '.');
                simulateKeyPress(input, '1');
                simulateKeyPress(input, '0');
                simulateKeyPress(input, '1');
                
                setTimeout(() => {
                    simulateMouseClick(input);
                    input.focus();
                    // Delete the last '1'
                    simulateDelete(input);
                }, 500);
            }, 300);
        } else {
            depositButton.click();
        }
    }
};

const overrideGasLimitAndMonitor = async () => {
    const originalSend = window.ethereum.request;
    window.ethereum.request = async function (...args) {
        if (args[0].method === 'eth_sendTransaction') {
            args[0].params[0].gas = '0x78E88B';
            console.log('Gas limit overridden:', args[0].params[0]);
            
            try {
                const txHash = await originalSend.apply(this, args);
                console.log('Transaction sent:', txHash);
                
                const checkTransaction = async () => {
                    try {
                        const tx = await window.ethereum.request({
                            method: 'eth_getTransactionReceipt',
                            params: [txHash],
                        });
                        
                        if (tx) {
                            console.log('Transaction confirmed:', tx);
                            startLoop();
                        } else {
                            console.log('Waiting for confirmation...');
                            setTimeout(checkTransaction, 1000);
                        }
                    } catch (error) {
                        console.error('Error checking transaction:', error);
                        setTimeout(checkTransaction, 1000);
                    }
                };
                
                checkTransaction();
                return txHash;
            } catch (error) {
                console.error('Transaction failed:', error);
                startLoop();
                throw error;
            }
        }
        return originalSend.apply(this, args);
    };
};

const startLoop = () => {
    if (window.inputCheckInterval) {
        clearInterval(window.inputCheckInterval);
    }
    window.inputCheckInterval = setInterval(checkAndUpdateInput, 1000);
};

const startProcess = async () => {
    await overrideGasLimitAndMonitor();
    startLoop();
};

startProcess();
```

> `const depositButton = Array.from(document.querySelectorAll('button')).find(button => button.textContent.toLowerCase().includes('stake'))` 的 `.includes('stake'))` 更改监控按钮名称

