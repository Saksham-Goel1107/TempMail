let token = null;
      let email = null;
      let pollingInterval = null;
      let qrCodeInstance = null;
      let confirmCallback = null;
      let previousMessageCount = 0;
      const originalTitle = document.title;
      let currentMessages = [];
      let emailRestored = false;

      // Load available domains
      async function loadDomains() {
        try {
          const response = await fetch("/domains");
          if (!response.ok) throw new Error("Failed to load domains");
          
          const data = await response.json();
          const domainSelect = document.getElementById("domain-select");
          domainSelect.innerHTML = "";
          
          data.domains.forEach(domain => {
            const option = document.createElement("option");
            option.value = domain;
            option.textContent = `@${domain}`;
            domainSelect.appendChild(option);
          });
          
          // Select first domain by default
          if (data.domains.length > 0) {
            domainSelect.value = data.domains[0];
          }
        } catch (error) {
          console.error("Error loading domains:", error);
          const domainSelect = document.getElementById("domain-select");
          domainSelect.innerHTML = '<option value="">Failed to load domains</option>';
        }
      }

      // Load saved email from localStorage
      function loadSavedEmail() {
        try {
          const saved = localStorage.getItem("savedEmail");
          const savedPersistence = localStorage.getItem("emailPersistence") === "true";
          
          // Restore toggle state
          const persistToggle = document.getElementById("persist-toggle");
          persistToggle.checked = savedPersistence;
          
          if (saved && savedPersistence) {
            const savedData = JSON.parse(saved);
            
            email = savedData.email;
            token = savedData.token;
            currentMessages = savedData.messages || [];
            
            document.getElementById("email-display").textContent = email;
            document.getElementById("copy-icon-btn").style.display = "flex";
            document.getElementById("qr-btn").style.display = "flex";
            
            showSuccess("✨ Previous email restored!");
            
            // Update messages display
            updateMessagesDisplay();
            
            // Start polling
            if (pollingInterval) clearInterval(pollingInterval);
            pollingInterval = setInterval(fetchMessages, 10000);
            document.getElementById("auto-refresh-indicator").style.display = "flex";
            
            emailRestored = true;
            return true; // Email was restored
          }
        } catch (error) {
          console.error("Error loading saved email:", error);
        }
        return false; // No email restored
      }

      // Save current email to localStorage
      function saveCurrentEmail() {
        if (!email || !token) return;
        
        try {
          const emailData = {
            email: email,
            token: token,
            messages: currentMessages,
            savedAt: new Date().toISOString()
          };
          localStorage.setItem("savedEmail", JSON.stringify(emailData));
        } catch (error) {
          console.error("Error saving email:", error);
        }
      }

      // Clear saved email
      function clearSavedEmail() {
        try {
          localStorage.removeItem("savedEmail");
        } catch (error) {
          console.error("Error clearing saved email:", error);
        }
      }

      // Update messages display
      function updateMessagesDisplay() {
        const messagesContainer = document.getElementById("messages");
        const inboxCount = document.getElementById("inbox-count");

        if (currentMessages.length === 0) {
          messagesContainer.innerHTML = `
            <div class="empty-inbox">
              <span>📭</span>
              <h3>No messages yet</h3>
              <p>Your inbox is empty. Share your email address to start receiving messages!</p>
            </div>
          `;
          inboxCount.textContent = "0";
          return;
        }

        inboxCount.textContent = currentMessages.length;

        messagesContainer.innerHTML = currentMessages.map((msg, index) => `
          <div class="message-item" data-index="${index}">
            <div class="message-row">
              <div class="message-icon">✉️</div>
              <div class="message-content">
                <div class="message-sender">${msg.from}</div>
                <div class="message-subject">${msg.subject || "No subject"}</div>
                <div class="message-preview">${(msg.text || "").substring(0, 120)}${(msg.text || "").length > 120 ? "..." : ""}</div>
              </div>
              <div class="message-time">
                ${new Date(msg.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
              <div class="message-arrow">→</div>
            </div>
          </div>
        `).join("");

        // Add click handlers for message items
        document.querySelectorAll(".message-item").forEach((item, index) => {
          item.addEventListener("click", () => {
            showMessageDetail(currentMessages[index]);
          });
        });
      }

      // Validate custom username
      function validateUsername(username) {
        if (!username) return { valid: true }; // Empty is allowed (random username)

        // Only allow letters, numbers, dots, and underscores
        const usernameRegex = /^[a-zA-Z0-9._]+$/;
        if (!usernameRegex.test(username)) {
          return { valid: false, error: "Username can only contain letters, numbers, dots, and underscores" };
        }

        if (username.length < 3) {
          return { valid: false, error: "Username must be at least 3 characters long" };
        }

        if (username.length > 50) {
          return { valid: false, error: "Username must be less than 50 characters long" };
        }

        return { valid: true };
      }

      // Dark mode initialization
      const initTheme = () => {
        const savedTheme = localStorage.getItem("theme") || "light";
        document.documentElement.setAttribute("data-theme", savedTheme);
        updateThemeIcon(savedTheme);
      };

      const toggleTheme = () => {
        const currentTheme =
          document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        updateThemeIcon(newTheme);
        showToast(
          newTheme === "dark"
            ? "🌙 Dark mode enabled"
            : "☀️ Light mode enabled",
          "success"
        );
      };

      const updateThemeIcon = (theme) => {
        const icon = document.getElementById("theme-toggle");
        icon.textContent = theme === "dark" ? "☀️" : "🌙";
      };

      // Initialize theme on load
      initTheme();

      // Initialize app
      loadDomains();
      loadSavedEmail();
      loadSavedWebhook();

      // Event Listeners
      document
        .getElementById("theme-toggle")
        .addEventListener("click", toggleTheme);
      document.getElementById("change-btn").addEventListener("click", () => {
        if (email) {
          showConfirm(
            "🔄",
            "Generate New Email?",
            "This will create a new temporary email address. Your current email and all its messages will be lost.",
            () => createAccount()
          );
        } else {
          createAccount();
        }
      });
      document.getElementById("copy-btn").addEventListener("click", copyEmail);
      document
        .getElementById("copy-icon-btn")
        .addEventListener("click", copyEmail);
      document.getElementById("refresh-btn").addEventListener("click", () => {
        refreshMessages();
      });
      document.getElementById("delete-btn").addEventListener("click", () => {
        showConfirm(
          "🗑️",
          "Delete Email?",
          "Are you sure you want to delete this email? All messages will be permanently lost and cannot be recovered.",
          () => deleteAccount()
        );
      });
      document.getElementById("qr-btn").addEventListener("click", showQRCode);
      document
        .getElementById("close-qr-modal")
        .addEventListener("click", closeQRModal);
      document
        .getElementById("close-message-modal")
        .addEventListener("click", closeMessageModal);

      // Persistence toggle handler
      document.getElementById("persist-toggle").addEventListener("change", (e) => {
        const isEnabled = e.target.checked;
        
        // Save toggle state
        localStorage.setItem("emailPersistence", isEnabled.toString());
        
        if (isEnabled) {
          // Save current email if one exists
          if (email && token) {
            saveCurrentEmail();
            showSuccess("💾 Email persistence enabled - your email will be remembered");
          } else {
            showSuccess("💾 Email persistence enabled");
          }
        } else {
          // Clear saved email
          clearSavedEmail();
          showSuccess("🗑️ Email persistence disabled - saved email cleared");
        }
      });

      // Webhook configuration handler
      document.getElementById("configure-webhook-btn").addEventListener("click", async () => {
        const webhookUrl = document.getElementById("webhook-url").value.trim();

        if (!email) {
          showError("❌ Please create an email address first");
          return;
        }

        try {
          const response = await fetch("/webhook/configure", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              email: email,
              webhook_url: webhookUrl
            })
          });

          const data = await response.json();

          if (response.ok) {
            if (webhookUrl) {
              showSuccess("🔗 Webhook configured successfully!");
              localStorage.setItem(`webhook_${email}`, webhookUrl);
            } else {
              showSuccess("🔗 Webhook removed successfully!");
              localStorage.removeItem(`webhook_${email}`);
            }
          } else {
            showError(`❌ ${data.detail || "Failed to configure webhook"}`);
          }
        } catch (error) {
          showError("❌ Failed to configure webhook");
          console.error("Webhook configuration error:", error);
        }
      });

      // Load saved webhook URL when email is restored
      function loadSavedWebhook() {
        if (email) {
          const savedWebhook = localStorage.getItem(`webhook_${email}`);
          if (savedWebhook) {
            document.getElementById("webhook-url").value = savedWebhook;
          }
        }
      }

      // Confirmation modal handlers
      document
        .getElementById("confirm-cancel")
        .addEventListener("click", closeConfirm);
      document.getElementById("confirm-ok").addEventListener("click", () => {
        if (confirmCallback) {
          confirmCallback();
        }
        closeConfirm();
      });

      // Close QR modal when clicking outside
      document
        .getElementById("qr-modal")
        .addEventListener("click", function (e) {
          if (e.target === this) {
            closeQRModal();
          }
        });

      // Close message modal when clicking outside
      document
        .getElementById("message-modal")
        .addEventListener("click", function (e) {
          if (e.target === this) {
            closeMessageModal();
          }
        });

      // Close confirm modal when clicking outside
      document
        .getElementById("confirm-modal")
        .addEventListener("click", function (e) {
          if (e.target === this) {
            closeConfirm();
          }
        });

      // Show confirmation modal
      function showConfirm(icon, title, message, callback) {
        document.getElementById("confirm-icon").textContent = icon;
        document.getElementById("confirm-title").textContent = title;
        document.getElementById("confirm-message").textContent = message;
        confirmCallback = callback;
        document.getElementById("confirm-modal").classList.add("active");
      }

      // Close confirmation modal
      function closeConfirm() {
        document.getElementById("confirm-modal").classList.remove("active");
        confirmCallback = null;
      }

      // Handle messages from iframe (link clicks)
      window.addEventListener("message", function (event) {
        if (event.data.type === "link-click") {
          const url = event.data.url;
          showConfirm(
            "🌐",
            "External Link Warning",
            `This link will take you outside TempMail to:\n\n${url}\n\nAre you sure you want to proceed?`,
            function () {
              window.open(url, "_blank", "noopener,noreferrer");
            }
          );
        }
      });

      async function createAccount() {
        try {
          hideError();
          const btn = document.getElementById("change-btn");
          btn.disabled = true;

          const domainSelect = document.getElementById("domain-select");
          const selectedDomain = domainSelect.value;

          const customUsernameInput = document.getElementById("custom-username");
          const customUsername = customUsernameInput.value.trim();

          // Validate custom username
          const validation = validateUsername(customUsername);
          if (!validation.valid) {
            showError(`❌ ${validation.error}`);
            btn.disabled = false;
            return;
          }

          const persistToggle = document.getElementById("persist-toggle");
          const shouldPersist = persistToggle.checked;

          // If creating new email and persistence is disabled, clear any saved email
          if (!shouldPersist) {
            clearSavedEmail();
          }

          const requestBody = { domain: selectedDomain };
          if (customUsername) {
            requestBody.username = customUsername;
          }

          const response = await fetch("/create_account", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 400 && errorData.detail && errorData.detail.includes("Username already taken")) {
              throw new Error("Username already taken. Please choose a different username.");
            } else {
              throw new Error(errorData.detail || "Failed to create account");
            }
          }

          const data = await response.json();
          email = data.email;
          token = data.token;
          currentMessages = []; // Reset messages for new email

          // Save the new email instantly if persistence is enabled
          if (shouldPersist) {
            saveCurrentEmail();
          }

          // Save the new email instantly if persistence is enabled
          if (shouldPersist) {
            saveCurrentEmail();
          }

          document.getElementById("email-display").textContent = email;
          document.getElementById("copy-icon-btn").style.display = "flex";
          document.getElementById("qr-btn").style.display = "flex";

          // Load saved webhook for new email
          loadSavedWebhook();
          btn.disabled = false;

          showSuccess("✨ Email created successfully!");

          // Load saved webhook for the new email
          loadSavedWebhook();

          // Start polling for messages
          if (pollingInterval) clearInterval(pollingInterval);
          pollingInterval = setInterval(fetchMessages, 10000);
          document.getElementById("auto-refresh-indicator").style.display = "flex";
          fetchMessages();
        } catch (error) {
          showError(`❌ Error: ${error.message}`);
          document.getElementById("change-btn").disabled = false;
        }
      }

      async function copyEmail() {
        if (!email) {
          showError("⚠️ Please create an email first");
          return;
        }
        try {
          await navigator.clipboard.writeText(email);
          const btn = document.getElementById("copy-btn");
          const iconBtn = document.getElementById("copy-icon-btn");
          const original = btn.innerHTML;
          const originalIcon = iconBtn.innerHTML;

          btn.innerHTML = "<span>✅</span> Copied!";
          iconBtn.innerHTML = "✅";

          showSuccess("📋 Email copied to clipboard!");

          setTimeout(() => {
            btn.innerHTML = original;
            iconBtn.innerHTML = originalIcon;
          }, 2000);
        } catch (error) {
          showError("❌ Failed to copy email");
        }
      }

      function deleteAccount() {
        setTimeout(() => {
          token = null;
          email = null;
          if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
          }

          document.getElementById("email-display").textContent =
            "Generating your secure email...";
          document.getElementById("copy-icon-btn").style.display = "none";
          document.getElementById("qr-btn").style.display = "none";
          document.getElementById("inbox-count").textContent = "0";
          document.getElementById("stat-emails").textContent = "0";
          document.getElementById("auto-refresh-indicator").style.display =
            "none";
          document.getElementById("messages").innerHTML = `
                    <div class="empty-inbox">
                        <div class="empty-inbox-icon">📭</div>
                        <div class="empty-inbox-text">Your inbox is empty</div>
                        <div class="empty-inbox-subtext">Create a new email to start receiving messages</div>
                    </div>
                `;

          showSuccess("🗑️ Email deleted successfully!");
        }, 800);
      }

      async function refreshMessages() {
        if (!token) {
          showError("⚠️ Please create an email first");
          return;
        }

        const btn = document.getElementById("refresh-btn");
        const original = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML =
          '<span style="display:inline-block;animation:spin 1s linear infinite;">🔄</span> Refreshing...';

        try {
          await fetchMessages();
          showSuccess("✅ Inbox refreshed!");
        } catch (error) {
          showError("❌ Failed to refresh inbox");
        } finally {
          setTimeout(() => {
            btn.innerHTML = original;
            btn.disabled = false;
          }, 1000);
        }
      }

      async function fetchMessages() {
        if (!token) return;

        try {
          const response = await fetch(
            `/messages?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
          );
          if (!response.ok) throw new Error("Failed to fetch messages");

          const data = await response.json();
          currentMessages = data.messages; // Store messages
          const currentCount = data.messages.length;

          updateMessagesDisplay();
          document.getElementById("inbox-count").textContent = currentCount;
          document.getElementById("stat-emails").textContent = currentCount;

          // Auto-save if persistence is enabled
          const persistToggle = document.getElementById("persist-toggle");
          if (persistToggle.checked && email && token) {
            saveCurrentEmail();
          }

          // Update page title for new messages
          if (currentCount > previousMessageCount && previousMessageCount > 0) {
            const newMessages = currentCount - previousMessageCount;
            document.title = `(${newMessages}) New Message${
              newMessages > 1 ? "s" : ""
            } - ${originalTitle}`;

            // Show notification
            showSuccess(
              `📬 ${newMessages} new message${
                newMessages > 1 ? "s" : ""
              } received!`
            );
          } else if (currentCount === 0) {
            document.title = originalTitle;
          }

          previousMessageCount = currentCount;
        } catch (error) {
          console.error("Error fetching messages:", error);
          throw error;
        }
      }

      // Reset title when window is focused
      window.addEventListener("focus", () => {
        document.title = originalTitle;
      });

      function displayMessages(messages) {
        const messagesDiv = document.getElementById("messages");

        // Hide skeleton loader
        const skeleton = document.getElementById("skeleton-loader");
        if (skeleton) skeleton.remove();

        if (messages.length === 0) {
          messagesDiv.innerHTML = `
                    <div class="empty-inbox">
                        <div class="empty-inbox-icon">📭</div>
                        <div class="empty-inbox-text">Your inbox is empty</div>
                        <div class="empty-inbox-subtext">New messages will appear here automatically</div>
                    </div>
                `;
          return;
        }

        const now = Date.now();
        messagesDiv.innerHTML = messages
          .map((msg, index) => {
            const msgDate = new Date(msg.date).getTime();
            const isNew = now - msgDate < 300000; // Less than 5 minutes old

            return `
                <div class="message-item" data-index="${index}" style="animation: slideIn 0.3s ease-out ${
              index * 0.05
            }s backwards;">
                    <div class="message-row">
                        <div class="message-sender">
                            ${escapeHtml(msg.from)}
                            ${
                              isNew
                                ? '<span class="message-badge">New</span>'
                                : ""
                            }
                            ${
                              msg.hasAttachments
                                ? '<span style="margin-left:6px;">📎</span>'
                                : ""
                            }
                        </div>
                        <div class="message-subject">${escapeHtml(
                          msg.subject || "(No Subject)"
                        )}</div>
                        <div class="message-date">${formatDate(msg.date)}</div>
                    </div>
                </div>
            `;
          })
          .join("");

        // Add click handlers to open message detail modal
        document.querySelectorAll(".message-item").forEach((item, index) => {
          item.addEventListener("click", function (e) {
            e.stopPropagation();
            showMessageDetail(messages[index]);
          });
        });
      }

      function showMessageDetail(msg) {
        // Populate modal with message details
        document.getElementById("detail-subject").textContent =
          msg.subject || "(No Subject)";
        document.getElementById("detail-from").textContent = msg.from;
        document.getElementById("detail-date").textContent = new Date(
          msg.date
        ).toLocaleString();

        const contentDiv = document.getElementById("detail-content");

        // Check if HTML content is available and render it
        if (msg.html && msg.html.length > 0) {
          let htmlContent = Array.isArray(msg.html) ? msg.html[0] : msg.html;

          // Sanitize HTML with DOMPurify for security - allow all necessary tags
          const cleanHTML = DOMPurify.sanitize(htmlContent, {
            ALLOWED_TAGS: [
              "html",
              "head",
              "body",
              "meta",
              "title",
              "style",
              "link",
              "p",
              "br",
              "strong",
              "b",
              "em",
              "i",
              "u",
              "s",
              "h1",
              "h2",
              "h3",
              "h4",
              "h5",
              "h6",
              "ul",
              "ol",
              "li",
              "a",
              "img",
              "div",
              "span",
              "table",
              "thead",
              "tbody",
              "tr",
              "td",
              "th",
              "blockquote",
              "pre",
              "code",
              "hr",
              "center",
              "font",
              "small",
              "big",
              "sub",
              "sup",
              "section",
              "article",
              "header",
              "footer",
              "main",
              "nav",
              "aside",
            ],
            ALLOWED_ATTR: [
              "href",
              "src",
              "alt",
              "title",
              "style",
              "class",
              "target",
              "width",
              "height",
              "align",
              "valign",
              "bgcolor",
              "color",
              "face",
              "size",
              "border",
              "cellpadding",
              "cellspacing",
              "id",
              "name",
              "type",
              "charset",
              "content",
              "http-equiv",
              "rel",
              "lang",
              "dir",
            ],
            ALLOW_DATA_ATTR: false,
            KEEP_CONTENT: true,
            RETURN_DOM: false,
            RETURN_DOM_FRAGMENT: false,
            FORCE_BODY: false,
            WHOLE_DOCUMENT: false,
          });

          // Get current theme
          const isDark =
            document.documentElement.getAttribute("data-theme") === "dark";
          const iframeBg = isDark ? "#1e293b" : "#ffffff";

          // Create an iframe to safely render sanitized HTML (no JavaScript execution)
          contentDiv.innerHTML = `<iframe id="html-frame" sandbox="allow-same-origin" style="width: 100%; min-height: 500px; border: none; border-radius: 8px; background: ${iframeBg};"></iframe>`;
          const iframe = document.getElementById("html-frame");

          // Write HTML content immediately
          setTimeout(() => {
            try {
              const iframeDoc =
                iframe.contentDocument || iframe.contentWindow.document;
              iframeDoc.open();

              // Create a complete HTML document with sanitized content
              const fullHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Email Content</title>
</head>
<body>
    ${cleanHTML}
</body>
</html>`;

              iframeDoc.write(fullHTML);

              // Inject CSS for readability and link handling
              const style = iframeDoc.createElement("style");
              if (isDark) {
                style.textContent = `
                                body { color: #f1f5f9 !important; background: #1e293b !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 20px; }
                                * { color: inherit; }
                                a { color: #818cf8 !important; text-decoration: underline; }
                                a:hover { color: #a5b4fc !important; }
                            `;
              } else {
                style.textContent = `
                                body { color: #0f172a !important; background: #ffffff !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 20px; }
                                * { color: inherit; }
                                a { color: #6366f1 !important; text-decoration: underline; }
                                a:hover { color: #4f46e5 !important; }
                            `;
              }
              iframeDoc.head.appendChild(style);

              // Handle link clicks without JavaScript - links will open in new tab
              const links = iframeDoc.querySelectorAll("a");
              links.forEach((link) => {
                if (link.href) {
                  link.setAttribute("target", "_blank");
                  link.setAttribute("rel", "noopener noreferrer");
                }
              });

              iframeDoc.close();

              // Adjust iframe height after content loads
              setTimeout(() => {
                try {
                  const height =
                    iframeDoc.documentElement.scrollHeight ||
                    iframeDoc.body.scrollHeight;
                  iframe.style.height = Math.max(500, height + 40) + "px";
                } catch (e) {
                  iframe.style.height = "600px";
                }
              }, 300);
            } catch (e) {
              console.error("Error rendering HTML:", e);
              // Fallback to text if HTML rendering fails
              contentDiv.innerHTML = `<div style="white-space: pre-wrap; line-height: 1.8; color: var(--text); padding: 20px; background: var(--light); border-radius: 8px;">${escapeHtml(
                msg.text || "Failed to render email content"
              )}</div>`;
            }
          }, 50);
        } else if (msg.text) {
          // Fallback to text content if no HTML
          contentDiv.innerHTML = `<div style="white-space: pre-wrap; line-height: 1.8; color: var(--text); padding: 20px; background: var(--light); border-radius: 8px;">${escapeHtml(
            msg.text
          )}</div>`;
        } else {
          contentDiv.innerHTML =
            '<p style="color: var(--text-muted); text-align: center; padding: 40px;">No content available</p>';
        }

        // Show modal
        document.getElementById("message-modal").classList.add("active");
      }

      function closeMessageModal() {
        document.getElementById("message-modal").classList.remove("active");
      }

      function showQRCode() {
        if (!email) {
          showError("⚠️ Please create an email first");
          return;
        }

        const modal = document.getElementById("qr-modal");
        const qrcodeDiv = document.getElementById("qrcode");

        // Clear previous QR code
        qrcodeDiv.innerHTML = "";

        // Generate new QR code
        try {
          new QRCode(qrcodeDiv, {
            text: email,
            width: 220,
            height: 220,
            colorDark: "#1e293b",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H,
          });

          modal.classList.add("active");
        } catch (error) {
          showError("❌ Failed to generate QR code");
          console.error("QR Code error:", error);
        }
      }

      function closeQRModal() {
        document.getElementById("qr-modal").classList.remove("active");
      }

      function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
      }

      function escapeHtml(text) {
        const map = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
      }

      function showError(message) {
        showToast(message, "error");
        const errorDiv = document.getElementById("error");
        document.getElementById("error-text").textContent = message;
        errorDiv.style.display = "flex";
        errorDiv.style.animation = "slideIn 0.3s ease-out";
        setTimeout(() => {
          errorDiv.style.animation = "fadeOut 0.3s ease-out";
          setTimeout(() => (errorDiv.style.display = "none"), 300);
        }, 5000);
      }

      function hideError() {
        document.getElementById("error").style.display = "none";
      }

      function showSuccess(message) {
        showToast(message, "success");
      }

      // Toast notification system
      function showToast(message, type = "info") {
        const container = document.getElementById("toast-container");
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;

        const icons = {
          success: "✅",
          error: "❌",
          info: "ℹ️",
          warning: "⚠️",
        };

        toast.innerHTML = `
                <div class="toast-icon">${icons[type] || icons.info}</div>
                <div class="toast-content">${message}</div>
                <button class="toast-close" onclick="this.parentElement.remove()">×</button>
            `;

        container.appendChild(toast);

        setTimeout(() => {
          toast.style.animation = "slideInRight 0.3s ease-out reverse";
          setTimeout(() => toast.remove(), 300);
        }, 4000);
      }

      // Keyboard shortcuts
      document.addEventListener("keydown", (e) => {
        // Ctrl/Cmd + C to copy email
        if (
          (e.ctrlKey || e.metaKey) &&
          e.key === "c" &&
          email &&
          !window.getSelection().toString()
        ) {
          e.preventDefault();
          copyEmail();
        }
        // Ctrl/Cmd + R to refresh
        if ((e.ctrlKey || e.metaKey) && e.key === "r" && token) {
          e.preventDefault();
          refreshMessages();
        }
        // Escape to close modals
        if (e.key === "Escape") {
          closeQRModal();
          closeMessageModal();
          closeConfirm();
        }
      });

      // Auto-create email on page load only if no email was restored
      window.addEventListener("load", () => {
        if (!emailRestored) {
          // Only create account if no email was restored from localStorage
          createAccount();
        }
        initNavigation();
        initBackToTop();
        initCookieConsent();
        initContactForm();
      });

      // Navigation functionality
      function initNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
          link.addEventListener('click', (e) => {
            // Allow modified clicks (ctrl/cmd/middle-click/shift/alt) so users can open in new tab/window
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) {
              return; // let the browser handle opening the link
            }

            const href = link.getAttribute('href') || '';

            // Only intercept internal hash links (e.g. "#features").
            // For other links (external or path-based) allow normal navigation.
            if (!href.startsWith('#')) {
              return; // not a hash link — do not prevent default
            }

            e.preventDefault();
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
              const header = document.querySelector('.header');
              const headerHeight = header ? header.offsetHeight : 0;
              const targetPosition = targetElement.offsetTop - headerHeight - 20;

              window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
              });
            }
          });
        });
      }

      // Back to top functionality
      function initBackToTop() {
        const backToTopBtn = document.getElementById('back-to-top');
        
        window.addEventListener('scroll', () => {
          if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('show');
          } else {
            backToTopBtn.classList.remove('show');
          }
        });
        
        backToTopBtn.addEventListener('click', () => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        });
      }

      // Cookie consent functionality
      function initCookieConsent() {
        const cookieConsent = document.getElementById('cookie-consent');
        const acceptBtn = document.getElementById('accept-cookies');
        const declineBtn = document.getElementById('decline-cookies');
        
        // Check if user has already made a choice
        const cookieChoice = localStorage.getItem('cookie-consent');
        if (!cookieChoice) {
          // Show cookie consent after a delay
          setTimeout(() => {
            cookieConsent.classList.add('show');
          }, 2000);
        }
        
        acceptBtn.addEventListener('click', () => {
          localStorage.setItem('cookie-consent', 'accepted');
          cookieConsent.classList.remove('show');
          showToast('🍪 Cookies accepted', 'success');
          
          // Initialize analytics if accepted
          initAnalytics();
        });
        
        declineBtn.addEventListener('click', () => {
          localStorage.setItem('cookie-consent', 'declined');
          cookieConsent.classList.remove('show');
          showToast('🍪 Cookies declined', 'info');
        });
      }

      // Contact form functionality
      function initContactForm() {
        const contactForm = document.getElementById('contact-form');

        contactForm.addEventListener('submit', (e) => {
          // Don't prevent default - let Pageclip handle the submission
          // Add loading state
          const submitBtn = contactForm.querySelector('button[type="submit"]');
          const originalText = submitBtn.textContent;
          submitBtn.disabled = true;
          submitBtn.textContent = 'Sending...';

          // Pageclip will handle the actual submission
          // We'll listen for success/failure via Pageclip events
          setTimeout(() => {
            // Reset button after a delay (Pageclip should handle this, but fallback)
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }, 5000);
        });

        // Listen for Pageclip success
        if (window.Pageclip) {
          window.Pageclip.on('success', () => {
            showToast('📧 Message sent successfully!', 'success');
            document.getElementById('contact-form').reset();

            // Reset button
            const submitBtn = document.getElementById('contact-form').querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';

            // Track contact form submission
            if (typeof gtag !== 'undefined') {
              gtag('event', 'contact_form_submit', {
                event_category: 'engagement',
                event_label: 'contact_form'
              });
            }
          });

          window.Pageclip.on('error', () => {
            showToast('❌ Failed to send message. Please try again.', 'error');

            // Reset button
            const submitBtn = document.getElementById('contact-form').querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
          });
        }
      }

      // Analytics initialization (placeholder)
      function initAnalytics() {
        // Google Analytics placeholder
        // Replace with your actual GA tracking ID
        if (localStorage.getItem('cookie-consent') === 'accepted') {
          // Load Google Analytics script
          const script = document.createElement('script');
          script.async = true;
          script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID';
          document.head.appendChild(script);

          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'GA_TRACKING_ID');

          // Track page view
          gtag('event', 'page_view', {
            page_title: document.title,
            page_location: window.location.href
          });
        }
      }

      // Accessibility improvements
      function initAccessibility() {
        // Add focus indicators
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
          }
        });
        
        document.addEventListener('mousedown', () => {
          document.body.classList.remove('keyboard-navigation');
        });
        
        // Add ARIA labels where needed
        const buttons = document.querySelectorAll('button:not([aria-label])');
        buttons.forEach(btn => {
          if (!btn.getAttribute('aria-label') && !btn.textContent.trim()) {
            btn.setAttribute('aria-label', 'Button');
          }
        });
      }

      // Initialize accessibility features
      initAccessibility();

      // Load domains on page load
      loadDomains();