const emailInput = document.getElementById('emailInput');
        const checkBtn = document.getElementById('checkBtn');
        const resultDiv = document.getElementById('result');
        const themeToggle = document.getElementById('theme-toggle');

        // Theme toggle functionality
        const initTheme = () => {
            const savedTheme = localStorage.getItem('theme') || 'light';
            document.documentElement.setAttribute('data-theme', savedTheme);
            updateThemeIcon(savedTheme);
        };

        const toggleTheme = () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        };

        const updateThemeIcon = (theme) => {
            themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        };

        // Initialize theme on load
        initTheme();

        // Theme toggle event listener
        themeToggle.addEventListener('click', toggleTheme);

        checkBtn.addEventListener('click', checkEmail);
        emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                checkEmail();
            }
        });

        async function checkEmail() {
            const email = emailInput.value.trim();

            if (!email) {
                showResult('Please enter an email address', 'error');
                return;
            }

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showResult('Please enter a valid email address', 'error');
                return;
            }

            // Show loading state
            checkBtn.disabled = true;
            checkBtn.innerHTML = '<span class="loading"></span>🔍 Analyzing...';

            try {
                const response = await fetch(`https://pro-tempmail-api.onrender.com/check?email=${encodeURIComponent(email)}`);
                const data = await response.json();

                if (response.ok) {
                    if (data.tempmail) {
                        showResult(`🚫 <strong>${email}</strong> is a temporary/disposable email address`, 'error');
                    } else {
                        showResult(`✅ <strong>${email}</strong> appears to be a legitimate email address`, 'success');
                    }
                } else {
                    showResult(`❌ Error: ${data.error || 'Unknown error occurred'}`, 'error');
                }
            } catch (error) {
                console.error('Fetch error:', error);
                showResult('❌ Unable to connect to the server. Please try again later.', 'warning');
            } finally {
                checkBtn.disabled = false;
                checkBtn.innerHTML = '🔍 Check Email';
            }
        }

        function showResult(message, type) {
            let icon = '';
            let title = '';

            switch(type) {
                case 'success':
                    icon = '✅';
                    title = 'Legitimate Email';
                    break;
                case 'error':
                    icon = '🚫';
                    title = 'Disposable Email Detected';
                    break;
                case 'warning':
                    icon = '⚠️';
                    title = 'Warning';
                    break;
                default:
                    icon = 'ℹ️';
                    title = 'Result';
            }

            resultDiv.className = `result ${type}`;
            resultDiv.innerHTML = `
                <span class="result-icon">${icon}</span>
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="result-details">
                    <small>Checked at ${new Date().toLocaleTimeString()}</small>
                </div>
            `;
            resultDiv.style.display = 'block';

            // Add shake animation for error results
            if (type === 'error') {
                resultDiv.style.animation = 'slideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1), shake 0.5s ease-in-out 0.6s';
            } else {
                resultDiv.style.animation = 'slideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
            }
        }

        function setExample(email) {
            emailInput.value = email;
        }

        // Auto-focus on input
        window.addEventListener('load', () => {
            emailInput.focus();
        });

        // Add copy buttons to any code blocks (for future use)
        function addCopyButtons() {
            const codeBlocks = document.querySelectorAll('pre[class*="language-"]');

            codeBlocks.forEach((block) => {
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-btn';
                copyBtn.textContent = 'Copy';
                copyBtn.title = 'Copy to clipboard';
                copyBtn.style.cssText = `
                    position: absolute;
                    top: 0.5rem;
                    right: 0.5rem;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 0.4rem 0.8rem;
                    font-size: 0.8rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    opacity: 0.8;
                    z-index: 10;
                `;

                copyBtn.addEventListener('click', async () => {
                    const code = block.querySelector('code');
                    if (code) {
                        try {
                            await navigator.clipboard.writeText(code.textContent);
                            copyBtn.textContent = 'Copied!';
                            copyBtn.style.background = 'var(--secondary)';

                            setTimeout(() => {
                                copyBtn.textContent = 'Copy';
                                copyBtn.style.background = 'var(--primary)';
                            }, 2000);
                        } catch (err) {
                            console.error('Failed to copy: ', err);
                        }
                    }
                });

                block.style.position = 'relative';
                block.appendChild(copyBtn);
            });
        }

        // Initialize copy buttons
        setTimeout(addCopyButtons, 100);