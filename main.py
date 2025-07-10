import webview
from pathlib import Path
import sys
import os
import time
import tempfile
from datetime import datetime
import json

# Importar módulos para impresión
try:
    import win32print
    import win32ui
    import win32con
    import win32api
    from PIL import Image, ImageDraw, ImageFont
    from io import BytesIO
    import qrcode
    PRINTING_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ Módulos de impresión no disponibles: {e}")
    print("📦 Para habilitar impresión instale: pip install pywin32 pillow qrcode[pil]")
    PRINTING_AVAILABLE = False

class PrinterApi:
    def __init__(self):
        self.printing_available = PRINTING_AVAILABLE
        
    def get_available_printers(self):
        """Obtener lista de impresoras disponibles"""
        if not self.printing_available:
            return {"error": "Módulos de impresión no disponibles"}
        
        try:
            printers = []
            for printer in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS):
                printers.append({
                    "name": printer[2],
                    "status": "Disponible"
                })
            
            # Obtener impresora predeterminada
            default_printer = win32print.GetDefaultPrinter()
            
            return {
                "printers": printers,
                "default": default_printer,
                "available": True
            }
        except Exception as e:
            return {"error": f"Error obteniendo impresoras: {str(e)}"}

    def print_ticket_thermal(self, ticket_data, printer_name=None):
        """Imprimir ticket en formato térmico"""
        if not self.printing_available:
            return {"success": False, "error": "Módulos de impresión no disponibles"}
        
        try:
            # Usar impresora predeterminada si no se especifica
            if not printer_name:
                printer_name = win32print.GetDefaultPrinter()
            
            # Crear imagen del ticket
            ticket_image = self._create_thermal_ticket_image(ticket_data)
            
            # Imprimir imagen
            success = self._print_image(ticket_image, printer_name)
            
            if success:
                return {
                    "success": True, 
                    "message": f"Ticket impreso en {printer_name}",
                    "printer": printer_name
                }
            else:
                return {
                    "success": False, 
                    "error": "Error durante la impresión"
                }
                
        except Exception as e:
            return {
                "success": False, 
                "error": f"Error imprimiendo ticket: {str(e)}"
            }

    def _create_thermal_ticket_image(self, ticket_data):
        """Crear imagen del ticket en formato térmico (80mm)"""
        # Configuración para ticket térmico (80mm = ~300px a 96dpi)
        width = 300
        height = 800  # Altura inicial, se ajustará dinámicamente
        
        # Crear imagen
        img = Image.new('RGB', (width, height), 'white')
        draw = ImageDraw.Draw(img)
        
        # Fuentes (usar fuentes del sistema)
        try:
            font_title = ImageFont.truetype("arial.ttf", 16)
            font_normal = ImageFont.truetype("arial.ttf", 12)
            font_small = ImageFont.truetype("arial.ttf", 10)
            font_large = ImageFont.truetype("arialbd.ttf", 18)
        except:
            # Fallback a fuente predeterminada
            font_title = ImageFont.load_default()
            font_normal = ImageFont.load_default()
            font_small = ImageFont.load_default()
            font_large = ImageFont.load_default()
        
        y_pos = 20
        margin = 10
        
        # === ENCABEZADO ===
        self._draw_centered_text(draw, "EMBARCADERO FLOTANTE", y_pos, width, font_title, 'black')
        y_pos += 25
        
        self._draw_centered_text(draw, "Malecón San Juan del Puerto", y_pos, width, font_normal, 'black')
        y_pos += 20
        
        # Línea separadora
        draw.line([(margin, y_pos), (width - margin, y_pos)], fill='black', width=2)
        y_pos += 15
        
        # === INFORMACIÓN DE TICKET ===
        draw.text((margin, y_pos), "INFORMACIÓN DE TICKET", font=font_title, fill='black')
        y_pos += 20
        
        # Datos del ticket
        ticket_info = [
            ("CÓDIGO:", ticket_data.get('codigo', 'N/A')),
            ("FECHA EMISIÓN:", datetime.now().strftime('%d/%m/%Y')),
            ("HORA EMISIÓN:", datetime.now().strftime('%H:%M:%S'))
        ]
        
        for label, value in ticket_info:
            draw.text((margin, y_pos), label, font=font_small, fill='black')
            draw.text((margin + 80, y_pos), value, font=font_small, fill='black')
            y_pos += 15
        
        y_pos += 10
        draw.line([(margin, y_pos), (width - margin, y_pos)], fill='black', width=1)
        y_pos += 15
        
        # === DATOS DEL PASAJERO ===
        draw.text((margin, y_pos), "DATOS DEL PASAJERO", font=font_title, fill='black')
        y_pos += 20
        
        passenger_info = [
            ("NOMBRE:", ticket_data.get('nombre', 'N/A')),
            ("DOCUMENTO:", ticket_data.get('documento', 'N/A'))
        ]
        
        if ticket_data.get('telefono'):
            passenger_info.append(("TELÉFONO:", ticket_data.get('telefono')))
        
        for label, value in passenger_info:
            draw.text((margin, y_pos), label, font=font_small, fill='black')
            # Manejar texto largo
            if len(value) > 20:
                lines = self._wrap_text(value, 20)
                for i, line in enumerate(lines):
                    draw.text((margin + 80, y_pos + (i * 12)), line, font=font_small, fill='black')
                y_pos += len(lines) * 12
            else:
                draw.text((margin + 80, y_pos), value, font=font_small, fill='black')
                y_pos += 15
        
        y_pos += 10
        draw.line([(margin, y_pos), (width - margin, y_pos)], fill='black', width=1)
        y_pos += 15
        
        # === DETALLES DEL VIAJE ===
        draw.text((margin, y_pos), "DETALLES DEL VIAJE", font=font_title, fill='black')
        y_pos += 20
        
        trip_info = [
            ("FECHA VIAJE:", ticket_data.get('fecha', 'N/A')),
            ("HORA SALIDA:", ticket_data.get('hora', 'N/A')),
            ("EMBARCACIÓN:", ticket_data.get('embarcacion', 'N/A')),
            ("PASAJEROS:", f"{ticket_data.get('adultos', 0)} adultos" + 
                         (f", {ticket_data.get('ninos', 0)} niños" if ticket_data.get('ninos', 0) > 0 else ""))
        ]
        
        for label, value in trip_info:
            draw.text((margin, y_pos), label, font=font_small, fill='black')
            if len(value) > 20:
                lines = self._wrap_text(value, 20)
                for i, line in enumerate(lines):
                    draw.text((margin + 80, y_pos + (i * 12)), line, font=font_small, fill='black')
                y_pos += len(lines) * 12
            else:
                draw.text((margin + 80, y_pos), value, font=font_small, fill='black')
                y_pos += 15
        
        y_pos += 20
        
        # === TOTAL ===
        # Fondo del total
        draw.rectangle([(margin, y_pos), (width - margin, y_pos + 40)], 
                      fill='lightgray', outline='black', width=2)
        
        self._draw_centered_text(draw, "TOTAL A PAGAR", y_pos + 10, width, font_normal, 'black')
        self._draw_centered_text(draw, ticket_data.get('total', '$0'), y_pos + 25, width, font_large, 'black')
        y_pos += 50
        
        # === CÓDIGO QR ===
        if ticket_data.get('generateQR', True):
            try:
                qr_data = json.dumps({
                    "codigo": ticket_data.get('codigo'),
                    "pasajero": ticket_data.get('nombre'),
                    "documento": ticket_data.get('documento'),
                    "fecha": ticket_data.get('fecha'),
                    "hora": ticket_data.get('hora'),
                    "total": ticket_data.get('total'),
                    "timestamp": datetime.now().isoformat()
                })
                
                # Generar QR
                qr = qrcode.QRCode(version=1, box_size=3, border=4)
                qr.add_data(qr_data)
                qr.make(fit=True)
                
                qr_img = qr.make_image(fill_color="black", back_color="white")
                qr_img = qr_img.resize((80, 80))
                
                # Centrar QR
                qr_x = (width - 80) // 2
                img.paste(qr_img, (qr_x, y_pos))
                y_pos += 90
                
                self._draw_centered_text(draw, "Escanee para verificar", y_pos, width, font_small, 'black')
                y_pos += 20
            except Exception as e:
                print(f"Error generando QR: {e}")
                # QR placeholder
                draw.rectangle([(qr_x, y_pos), (qr_x + 80, y_pos + 80)], 
                              outline='black', width=2)
                self._draw_centered_text(draw, "QR CODE", y_pos + 40, width, font_small, 'black')
                y_pos += 90
        
        # === PIE DE PÁGINA ===
        y_pos += 15
        draw.line([(margin, y_pos), (width - margin, y_pos)], fill='black', width=1)
        y_pos += 15
        
        self._draw_centered_text(draw, "CONSERVE ESTE TICKET", y_pos, width, font_title, 'black')
        y_pos += 20
        
        footer_text = [
            "Válido únicamente para",
            "la fecha y hora indicadas",
            "Embalse de Guatapé",
            "Antioquia - Colombia"
        ]
        
        for text in footer_text:
            self._draw_centered_text(draw, text, y_pos, width, font_small, 'black')
            y_pos += 15
        
        y_pos += 10
        self._draw_centered_text(draw, datetime.now().strftime('%d/%m/%Y %H:%M:%S'), 
                               y_pos, width, font_small, 'gray')
        y_pos += 20
        
        # Redimensionar imagen al tamaño final
        final_img = Image.new('RGB', (width, y_pos + 20), 'white')
        final_img.paste(img, (0, 0))
        
        return final_img

    def _draw_centered_text(self, draw, text, y, width, font, color):
        """Dibujar texto centrado"""
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        x = (width - text_width) // 2
        draw.text((x, y), text, font=font, fill=color)

    def _wrap_text(self, text, max_chars):
        """Dividir texto en líneas"""
        words = text.split()
        lines = []
        current_line = ""
        
        for word in words:
            if len(current_line + " " + word) <= max_chars:
                current_line += " " + word if current_line else word
            else:
                if current_line:
                    lines.append(current_line)
                current_line = word
        
        if current_line:
            lines.append(current_line)
        
        return lines

    def _print_image(self, image, printer_name):
        """Imprimir imagen en la impresora especificada"""
        try:
            # Convertir imagen a formato compatible
            temp_path = tempfile.mktemp(suffix='.bmp')
            image.save(temp_path, 'BMP')
            
            # Configurar impresión
            hprinter = win32print.OpenPrinter(printer_name)
            
            try:
                # Iniciar trabajo de impresión
                hdc = win32ui.CreateDC()
                hdc.CreatePrinterDC(printer_name)
                
                # Configurar trabajo
                job_info = win32print.StartDocPrinter(hprinter, 1, 
                    ("Ticket Embarcación", None, "RAW"))
                
                # Imprimir imagen
                win32api.ShellExecute(0, "print", temp_path, None, ".", 0)
                
                return True
                
            finally:
                win32print.ClosePrinter(hprinter)
                # Limpiar archivo temporal
                try:
                    os.unlink(temp_path)
                except:
                    pass
                    
        except Exception as e:
            print(f"Error imprimiendo: {e}")
            return False

    def test_print(self, printer_name=None):
        """Imprimir página de prueba"""
        if not self.printing_available:
            return {"success": False, "error": "Módulos de impresión no disponibles"}
        
        try:
            test_data = {
                "codigo": "TEST-" + datetime.now().strftime('%Y%m%d%H%M%S'),
                "nombre": "PRUEBA DE IMPRESIÓN",
                "documento": "00000000",
                "fecha": datetime.now().strftime('%d/%m/%Y'),
                "hora": datetime.now().strftime('%H:%M'),
                "embarcacion": "Lancha de Prueba",
                "adultos": 1,
                "ninos": 0,
                "total": "$0",
                "generateQR": True
            }
            
            return self.print_ticket_thermal(test_data, printer_name)
            
        except Exception as e:
            return {"success": False, "error": f"Error en prueba: {str(e)}"}

class Api:
    def __init__(self):
        self.printer_api = PrinterApi()
    
    def say_hello(self, R):
        zr = 11
        return round(zr, 3)
    
    # === MÉTODOS DE IMPRESIÓN ===
    
    def get_printers(self):
        """Obtener lista de impresoras disponibles"""
        return self.printer_api.get_available_printers()
    
    def print_ticket(self, ticket_data, printer_name=None):
        """Imprimir ticket con datos específicos"""
        return self.printer_api.print_ticket_thermal(ticket_data, printer_name)
    
    def test_printer(self, printer_name=None):
        """Hacer prueba de impresión"""
        return self.printer_api.test_print(printer_name)
    
    def check_printing_status(self):
        """Verificar estado del sistema de impresión"""
        return {
            "available": self.printer_api.printing_available,
            "modules_loaded": PRINTING_AVAILABLE,
            "message": "Sistema de impresión listo" if PRINTING_AVAILABLE else "Instale pywin32, pillow y qrcode para habilitar impresión"
        }

if __name__ == '__main__':
    
    # Mostrar splash por al menos 2 segundos
    start_time = time.time()
    
    # Para compatibilidad con PyInstaller/auto-py-to-exe
    if getattr(sys, 'frozen', False):
        base_path = Path(sys._MEIPASS)
    else:
        base_path = Path(__file__).parent
    
    html_path = base_path / 'index.html'
    icon_path = base_path / 'static/images/FlexDesigner.ico'
    
    # Convierte la ruta local a URL estilo file://
    url = html_path.resolve().as_uri()

    # Crear ventana con API de impresión
    webview.create_window("Punto de venta - Con Impresión Directa", 
                         maximized=True, url=url, js_api=Api())
    
    # Asegurar que el splash se muestre al menos 2 segundos
    elapsed_time = time.time() - start_time
    if elapsed_time < 2.0:
        time.sleep(2.0 - elapsed_time)
    
    # Mostrar estado de impresión
    api = Api()
    print("=" * 50)
    print("🖨️ SISTEMA DE IMPRESIÓN DIRECTA")
    print("=" * 50)
    status = api.check_printing_status()
    print(f"Estado: {status['message']}")
    if status['available']:
        printers = api.get_printers()
        if 'printers' in printers:
            print(f"Impresoras disponibles: {len(printers['printers'])}")
            print(f"Impresora predeterminada: {printers['default']}")
        print("✅ Sistema listo para imprimir tickets")
    else:
        print("❌ Instale dependencias para habilitar impresión:")
        print("   pip install pywin32 pillow qrcode[pil]")
    print("=" * 50)

    # Iniciar aplicación
    try:
        if icon_path.exists():
            webview.start(icon=str(icon_path))
        else:
            webview.start()
    except:
        webview.start()