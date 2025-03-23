from smartcard.System import readers
from smartcard.util import toHexString, toBytes

def init_reader():
    r = readers()
    reader = r[0]
    connection = reader.createConnection()
    connection.connect()
    print("Card connected!")
    return connection


def write(connection, data):
    data_bytes = data.encode('ascii')
    chunks = []
    for i in range(0, len(data_bytes), 4):
        chunk = data_bytes[i:i+4]
        # Pad the chunk if it's less than 4 bytes
        if len(chunk) < 4:
            chunk = chunk + b'\x00' * (4 - len(chunk))
        chunks.append(chunk)

    print(f"Data will be written across {len(chunks)} pages")

    # Write each chunk to a separate page
    start_page = 4  # First user-writable page
    for i, chunk in enumerate(chunks):
        page = start_page + i

        # Write command for this page
        write_command = [0xFF, 0xD6, 0x00, page, 0x04] + list(chunk)
        response, sw1, sw2 = connection.transmit(write_command)

        if sw1 == 0x90 and sw2 == 0x00:
            print(f"Successfully wrote to page {page}: {chunk}")
        else:
            print(f"Failed to write to page {page}! SW1: {hex(sw1)}, SW2: {hex(sw2)}")
            break

def read(connection, num_pages=15, start_page=4):
    """
    Reads data from the NFC tag.
    
    Args:
        connection: The card connection
        num_pages: Number of pages to read
        start_page: The starting page (default: 4, first user writable page)
        
    Returns:
        The string read from the card
    """
    read_data = b''
    
    for i in range(num_pages):
        page = start_page + i
        
        read_command = [0xFF, 0xB0, 0x00, page, 0x04]
        response, sw1, sw2 = connection.transmit(read_command)
        
        if sw1 == 0x90 and sw2 == 0x00:
            read_data += bytes(response)
            print(f"Read from page {page}: {bytes(response)}")
        else:
            print(f"Failed to read page {page}! SW1: {hex(sw1)}, SW2: {hex(sw2)}")
            break
    
    # Strip trailing null bytes and decode
    read_string = read_data.rstrip(b'\x00').decode('ascii')
    print(f"Complete read string: '{read_string}'")
    return read_string

def disconnect(connection):
    connection.disconnect()
    print("Card disconnected.")
    
