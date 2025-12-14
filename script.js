// ===== STATE MANAGEMENT =====
        const state = {
            selectedFile: null,
            imageBase64: null,
            extractedData: null,
            isProcessing: false,
            startTime: null,
            uploadStartTime: null,
        };

        // ===== MOCK DATA =====
        const mockOCRResponse = {
            structured: {
                emails: [
                    { value: "john.doe@company.com", confidence: 0.98 },
                    { value: "contact@business.org", confidence: 0.95 },
                    { value: "support@example.com", confidence: 0.92 }
                ],
                dates: [
                    { value: "2025-12-14", confidence: 0.99 },
                    { value: "December 14, 2024", confidence: 0.97 },
                    { value: "14/12/2025", confidence: 0.96 }
                ],
                phones: [
                    { value: "+1-234-567-8900", confidence: 0.96 },
                    { value: "(555) 123-4567", confidence: 0.94 }
                ],
                urls: [
                    { value: "https://example.com", confidence: 0.98 },
                    { value: "https://company.org/about", confidence: 0.95 },
                    { value: "www.business.io/contact", confidence: 0.93 }
                ],
                currency: [
                    { amount: 1500, symbol: "$", confidence: 0.99 },
                    { amount: 250, symbol: "€", confidence: 0.97 },
                    { amount: 99.99, symbol: "£", confidence: 0.95 }
                ],
                tables: [
                    {
                        rows: [
                            ["Product", "Quantity", "Price", "Total"],
                            ["Widget A", "10", "$99.99", "$999.90"],
                            ["Widget B", "5", "$149.99", "$749.95"],
                            ["Service C", "2", "$500.00", "$1000.00"]
                        ],
                        confidence: 0.94
                    }
                ]
            },
            unstructured: {
                fullText: "Document Analysis Report\n\nThis comprehensive document contains critical business information including contact details, transaction dates, and financial summaries. The OCR system has successfully extracted and categorized all relevant data with high confidence scores.\n\nKey Highlights:\n• Professional document handling\n• Multi-format support\n• Real-time processing\n• Secure data extraction\n\nThe system demonstrates robust performance in handling various document types including invoices, receipts, contracts, and general business documents. All extracted data has been verified for accuracy and consistency.",
                language: "English"
            },
            metadata: {
                processingTime: 2450,
                textConfidence: 0.96,
                itemsExtracted: 12,
                pagesAnalyzed: 1
            }
        };

        // ===== UI HELPERS =====
        function showAlert(message, type = 'info') {
            const container = document.getElementById('alertContainer');
            const alert = document.createElement('div');
            alert.className = `alert alert-${type}`;
            alert.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            `;
            container.appendChild(alert);
            setTimeout(() => alert.remove(), 5000);
        }

        function escapeHtml(text) {
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
            return text.replace(/[&<>"']/g, m => map[m]);
        }

        function formatFileSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
            else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        }

        function formatJSON(obj) {
            return JSON.stringify(obj, null, 2);
        }

        // ===== FILE UPLOAD =====
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');

        uploadZone.addEventListener('click', () => fileInput.click());
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });
        uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) handleFileSelect(e.dataTransfer.files[0]);
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) handleFileSelect(e.target.files[0]);
        });

        function handleFileSelect(file) {
            if (!file.type.startsWith('image/')) {
                showAlert('Please select an image file', 'error');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                showAlert('File must be less than 10MB', 'error');
                return;
            }

            state.selectedFile = file;
            state.uploadStartTime = new Date();
            const reader = new FileReader();
            reader.onload = (e) => {
                state.imageBase64 = e.target.result;
                document.getElementById('previewImage').src = state.imageBase64;
                document.getElementById('fileSize').textContent = formatFileSize(file.size);
                document.getElementById('fileFormat').textContent = file.type.split('/')[1].toUpperCase();
                
                const img = new Image();
                img.onload = () => {
                    document.getElementById('fileDimensions').textContent = `${img.width}x${img.height}`;
                };
                img.src = state.imageBase64;

                const uploadTime = new Date() - state.uploadStartTime;
                document.getElementById('uploadTime').textContent = uploadTime + 'ms';

                document.getElementById('previewSection').style.display = 'block';
                showAlert('✓ Image uploaded successfully', 'success');
            };
            reader.readAsDataURL(file);
        }

        // ===== ANALYSIS =====
        document.getElementById('analyzeBtn').addEventListener('click', analyzeImage);

        function analyzeImage() {
            if (!state.imageBase64) {
                showAlert('Please select an image first', 'error');
                return;
            }

            state.isProcessing = true;
            state.startTime = Date.now();
            document.getElementById('previewSection').style.display = 'none';
            document.getElementById('processingSection').style.display = 'block';
            document.getElementById('resultsSection').style.display = 'none';

            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 25;
                if (progress > 100) progress = 100;

                document.getElementById('progressFill').style.width = progress + '%';
                document.getElementById('processingPercent').textContent = Math.round(progress) + '%';

                const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
                document.getElementById('processingTime').textContent = `Elapsed: ${elapsed}s`;

                const statuses = [
                    'Initializing OCR engine...',
                    'Analyzing image regions...',
                    'Detecting text blocks...',
                    'Extracting characters...',
                    'Classifying structured data...',
                    'Extracting unstructured content...',
                    'Generating confidence scores...',
                    'Finalizing results...'
                ];
                const statusIndex = Math.floor((progress / 100) * (statuses.length - 1));
                document.getElementById('processingStatus').textContent = statuses[statusIndex];

                if (progress >= 100) {
                    clearInterval(interval);
                    setTimeout(() => displayResults(), 1000);
                }
            }, 400);
        }

        function displayResults() {
            state.extractedData = mockOCRResponse;
            const data = mockOCRResponse;

            const totalItems = (data.structured.emails?.length || 0) + 
                              (data.structured.dates?.length || 0) + 
                              (data.structured.phones?.length || 0) + 
                              (data.structured.urls?.length || 0);

            document.getElementById('textCount').textContent = data.metadata.itemsExtracted;
            document.getElementById('structuredCount').textContent = totalItems;
            document.getElementById('confidence').textContent = Math.round(data.metadata.textConfidence * 100) + '%';
            document.getElementById('totalTime').textContent = data.metadata.processingTime + 'ms';

            displayEmails(data.structured.emails);
            displayDates(data.structured.dates);
            displayPhones(data.structured.phones);
            displayURLs(data.structured.urls);
            displayCurrency(data.structured.currency);
            displayTables(data.structured.tables);

            document.getElementById('textContent').textContent = data.unstructured.fullText;
            document.getElementById('rawJson').textContent = formatJSON(data);

            document.getElementById('processingSection').style.display = 'none';
            document.getElementById('resultsSection').style.display = 'block';
            showAlert('✓ Analysis completed successfully!', 'success');
        }

        function displayEmails(emails) {
            const container = document.getElementById('emailsList');
            container.innerHTML = '';
            if (!emails || emails.length === 0) {
                document.getElementById('emailsSection').style.display = 'none';
                return;
            }
            document.getElementById('emailsSection').style.display = 'block';
            emails.forEach(item => {
                const el = document.createElement('div');
                el.className = 'data-card';
                el.innerHTML = `
                    <div class="data-label"><i class="fas fa-envelope mr-1"></i>Email</div>
                    <div class="data-value">${item.value}</div>
                    <div class="confidence-badge">${Math.round(item.confidence * 100)}% match</div>
                `;
                container.appendChild(el);
            });
        }

        function displayDates(dates) {
            const container = document.getElementById('datesList');
            container.innerHTML = '';
            if (!dates || dates.length === 0) {
                document.getElementById('datesSection').style.display = 'none';
                return;
            }
            document.getElementById('datesSection').style.display = 'block';
            dates.forEach(item => {
                const el = document.createElement('div');
                el.className = 'data-card';
                el.innerHTML = `
                    <div class="data-label"><i class="fas fa-calendar mr-1"></i>Date</div>
                    <div class="data-value">${item.value}</div>
                    <div class="confidence-badge">${Math.round(item.confidence * 100)}% match</div>
                `;
                container.appendChild(el);
            });
        }

        function displayPhones(phones) {
            const container = document.getElementById('phonesList');
            container.innerHTML = '';
            if (!phones || phones.length === 0) {
                document.getElementById('phonesSection').style.display = 'none';
                return;
            }
            document.getElementById('phonesSection').style.display = 'block';
            phones.forEach(item => {
                const el = document.createElement('div');
                el.className = 'data-card';
                el.innerHTML = `
                    <div class="data-label"><i class="fas fa-phone mr-1"></i>Phone</div>
                    <div class="data-value">${item.value}</div>
                    <div class="confidence-badge">${Math.round(item.confidence * 100)}% match</div>
                `;
                container.appendChild(el);
            });
        }

        function displayURLs(urls) {
            const container = document.getElementById('urlsList');
            container.innerHTML = '';
            if (!urls || urls.length === 0) {
                document.getElementById('urlsSection').style.display = 'none';
                return;
            }
            document.getElementById('urlsSection').style.display = 'block';
            urls.forEach(item => {
                const el = document.createElement('div');
                el.className = 'data-card';
                el.innerHTML = `
                    <div class="data-label"><i class="fas fa-link mr-1"></i>URL</div>
                    <div class="data-value" style="word-break: break-word; font-size: 13px;">
                        <a href="${item.value}" target="_blank" class="text-neon-cyan hover:text-neon-green transition-colors">
                            ${item.value}
                        </a>
                    </div>
                    <div class="confidence-badge">${Math.round(item.confidence * 100)}% match</div>
                `;
                container.appendChild(el);
            });
        }

        function displayCurrency(currency) {
            const container = document.getElementById('currencyList');
            container.innerHTML = '';
            if (!currency || currency.length === 0) {
                document.getElementById('currencySection').style.display = 'none';
                return;
            }
            document.getElementById('currencySection').style.display = 'block';
            currency.forEach(item => {
                const el = document.createElement('div');
                el.className = 'data-card';
                el.innerHTML = `
                    <div class="data-label"><i class="fas fa-dollar-sign mr-1"></i>Amount</div>
                    <div class="data-value">${item.symbol}${item.amount.toLocaleString()}</div>
                    <div class="confidence-badge">${Math.round(item.confidence * 100)}% match</div>
                `;
                container.appendChild(el);
            });
        }

        function displayTables(tables) {
            const container = document.getElementById('tablesList');
            container.innerHTML = '';
            if (!tables || tables.length === 0) {
                document.getElementById('tablesSection').style.display = 'none';
                return;
            }
            document.getElementById('tablesSection').style.display = 'block';
            tables.forEach((table, idx) => {
                const div = document.createElement('div');
                div.className = 'glass rounded-lg p-6 overflow-x-auto';
                let html = '<table class="data-table"><thead><tr>';
                table.rows[0].forEach(cell => {
                    html += `<th>${escapeHtml(cell)}</th>`;
                });
                html += '</tr></thead><tbody>';
                table.rows.slice(1).forEach(row => {
                    html += '<tr>';
                    row.forEach(cell => {
                        html += `<td>${escapeHtml(cell)}</td>`;
                    });
                    html += '</tr>';
                });
                html += '</tbody></table>';
                html += `<p class="text-xs text-gray-500 mt-4"><i class="fas fa-check-circle mr-1"></i>Confidence: ${Math.round(table.confidence * 100)}%</p>`;
                div.innerHTML = html;
                container.appendChild(div);
            });
        }

        // ===== TABS =====
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
                btn.classList.add('active');
                document.getElementById(btn.getAttribute('data-tab') + '-tab').style.display = 'block';
            });
        });

        // ===== COPY FUNCTIONS =====
        document.getElementById('copyJsonBtn').addEventListener('click', () => {
            navigator.clipboard.writeText(document.getElementById('rawJson').textContent);
            showAlert('✓ JSON copied to clipboard!', 'success');
        });

        document.getElementById('copyTextBtn').addEventListener('click', () => {
            navigator.clipboard.writeText(document.getElementById('textContent').textContent);
            showAlert('✓ Text copied to clipboard!', 'success');
        });

        // ===== EXPORT FUNCTIONS =====
        document.getElementById('exportJson').addEventListener('click', () => {
            const data = formatJSON(state.extractedData);
            downloadFile(data, 'ocr-results.json', 'application/json');
        });

        document.getElementById('exportCsv').addEventListener('click', () => {
            const data = state.extractedData;
            let csv = 'Type,Value,Confidence\n';
            data.structured.emails?.forEach(e => csv += `Email,"${e.value}",${Math.round(e.confidence * 100)}%\n`);
            data.structured.dates?.forEach(d => csv += `Date,"${d.value}",${Math.round(d.confidence * 100)}%\n`);
            data.structured.phones?.forEach(p => csv += `Phone,"${p.value}",${Math.round(p.confidence * 100)}%\n`);
            data.structured.urls?.forEach(u => csv += `URL,"${u.value}",${Math.round(u.confidence * 100)}%\n`);
            downloadFile(csv, 'ocr-results.csv', 'text/csv');
        });

        document.getElementById('exportTxt').addEventListener('click', () => {
            const data = state.extractedData;
            let txt = 'OCR ANALYSIS RESULTS\n======================\n\n';
            txt += 'STRUCTURED DATA\n---------------\n';
            data.structured.emails && data.structured.emails.forEach(e => txt += `Email: ${e.value} (${Math.round(e.confidence * 100)}%)\n`);
            data.structured.dates && data.structured.dates.forEach(d => txt += `Date: ${d.value} (${Math.round(d.confidence * 100)}%)\n`);
            txt += '\nFULL TEXT\n---------\n' + data.unstructured.fullText;
            downloadFile(txt, 'ocr-results.txt', 'text/plain');
        });

        function downloadFile(content, filename, type) {
            const blob = new Blob([content], { type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            showAlert(`✓ ${filename} downloaded!`, 'success');
        }

        // ===== CLEAR =====
        document.getElementById('clearBtn').addEventListener('click', () => {
            state.selectedFile = null;
            state.imageBase64 = null;
            fileInput.value = '';
            document.getElementById('previewSection').style.display = 'none';
            document.getElementById('resultsSection').style.display = 'none';
            showAlert('✓ Cleared successfully', 'info');
        });