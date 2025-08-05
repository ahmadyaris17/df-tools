document.addEventListener('DOMContentLoaded', function () {
    const fileUploadForm = document.getElementById('fileUploadForm');
    const file1Input = document.getElementById('file1');
    const file2Input = document.getElementById('file2');
    const resultDiv = document.getElementById('result');
    const labelFile1 = document.getElementById('labelFile1'); // Dapatkan elemen label
    const labelFile2 = document.getElementById('labelFile2'); // Dapatkan elemen label

    // Fungsi untuk menampilkan notifikasi yang lebih baik
    function tampilkanNotifikasi(teks, tipe = 'info') {
        // Hapus notifikasi lama jika ada
        const notifLama = document.querySelector('.file-upload-notification');
        if (notifLama) notifLama.remove();
        
        const notif = document.createElement('div');
        notif.textContent = teks;
        notif.classList.add('file-upload-notification', tipe); // Tambah kelas tipe (misal: 'error', 'success')
        document.body.appendChild(notif);

        // Tambahkan CSS untuk animasi
        notif.style.animation = 'slide-in 0.5s forwards';

        // Hilangkan notifikasi setelah 3 detik
        setTimeout(() => {
            notif.style.animation = 'slide-out 0.5s forwards';
            setTimeout(() => notif.remove(), 500);
        }, 3000);
    }

    // Mendengarkan perubahan pada input file dan mengubah label
    file1Input.addEventListener('change', () => {
        if (file1Input.files.length > 0) {
            labelFile1.textContent = `File Terpilih: ${file1Input.files[0].name}`;
            tampilkanNotifikasi("File 1 berhasil diunggah.", 'success');
        } else {
            labelFile1.textContent = 'Upload File yang Lebih Banyak';
        }
    });

    file2Input.addEventListener('change', () => {
        if (file2Input.files.length > 0) {
            labelFile2.textContent = `File Terpilih: ${file2Input.files[0].name}`;
            tampilkanNotifikasi("File 2 berhasil diunggah.", 'success');
        } else {
            labelFile2.textContent = 'Upload File yang Lebih Sedikit';
        }
    });

    fileUploadForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const file1 = file1Input.files[0];
        const file2 = file2Input.files[0];

        if (!file1 || !file2) {
            tampilkanNotifikasi("Harap unggah kedua file.", 'error');
            return;
        }

        // Tampilkan pesan loading
        resultDiv.innerHTML = '<p>Memproses data, mohon tunggu...</p>';

        const reader1 = new FileReader();
        const reader2 = new FileReader();

        reader1.onload = function (event1) {
            try {
                const file1Data = JSON.parse(event1.target.result);
                reader2.onload = function (event2) {
                    try {
                        const file2Data = JSON.parse(event2.target.result);

                        const hasil = cariBarcodeDuplikatDanTidakAda(file1Data, file2Data);
                        
                        // Menampilkan hasil yang lebih mudah dibaca
                        resultDiv.innerHTML = `
                            <h2>Hasil Analisis</h2>
                            
                            <hr>
                            
                            <h3>Daftar Barcode Duplikat (${hasil.duplikatBarcodeFile2.length} ditemukan)</h3>
                            <ul class="result-list">
                                ${hasil.duplikatBarcodeFile2.length > 0 
                                    ? hasil.duplikatBarcodeFile2.map(item => `<li>${item}</li>`).join('')
                                    : '<li>Tidak ada barcode duplikat.</li>'}
                            </ul>
                            
                            <h3>Daftar Barcode Tidak Ada di File 2 (${hasil.barcodeTidakAdaFile2.length} ditemukan)</h3>
                            <ul class="result-list">
                                ${hasil.barcodeTidakAdaFile2.length > 0
                                    ? hasil.barcodeTidakAdaFile2.map(item => `<li>${item}</li>`).join('')
                                    : '<li>Semua barcode dari File 1 ada di File 2.</li>'}
                            </ul>
                        `;
                        tampilkanNotifikasi("File berhasil diproses!", 'success');
                    } catch (error) {
                        resultDiv.textContent = 'Gagal memproses File 2. Pastikan format file JSON valid.';
                        tampilkanNotifikasi('Kesalahan: File 2 tidak valid.', 'error');
                    }
                };
                reader2.readAsText(file2);
            } catch (error) {
                resultDiv.textContent = 'Gagal memproses File 1. Pastikan format file JSON valid.';
                tampilkanNotifikasi('Kesalahan: File 1 tidak valid.', 'error');
            }
        };
        reader1.readAsText(file1);
    });

    // Fungsi utama pencarian barcode
    function cariBarcodeDuplikatDanTidakAda(file1, file2) {
        const barcodeCounts = {};
        const duplikatBarcodeFile2 = [];
        const barcodeTidakAdaFile2 = [];
    
        // Menggunakan Set untuk performa yang lebih baik dalam mencari barcode unik
        const barcodesFile2 = new Set();
        const barcodesDuplikat = new Set();
    
        for (const obj of file2) {
            // Pastikan obj.kode_barcode ada dan bukan null/undefined
            if (obj && obj.kode_barcode !== undefined && obj.kode_barcode !== null) {
                if (barcodesFile2.has(obj.kode_barcode)) {
                    barcodesDuplikat.add(obj.kode_barcode);
                } else {
                    barcodesFile2.add(obj.kode_barcode);
                }
            }
        }
    
        for (const obj of file1) {
            // Pastikan obj.kode_barcode ada dan bukan null/undefined
            if (obj && obj.kode_barcode !== undefined && obj.kode_barcode !== null && !barcodesFile2.has(obj.kode_barcode)) {
                barcodeTidakAdaFile2.push(obj.kode_barcode);
            }
        }
    
        return { 
            duplikatBarcodeFile2: [...barcodesDuplikat], 
            barcodeTidakAdaFile2 
        };
    }
});