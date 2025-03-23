from smartcard.System import readers
from smartcard.util import toHexString, toBytes
import nfc

# String to write

def main():
    string_to_write = "Hello, this is a longer message that spans multiple pages!"
    connection = nfc.init_reader()
    nfc.write(connection, string_to_write)
    
    # Calculate how many pages were written
    data_bytes = string_to_write.encode('ascii')
    num_pages = (len(data_bytes) + 3) // 4  # Ceiling division
    
    msg = nfc.read(connection, num_pages)
    print("msg: ", msg)
    nfc.disconnect(connection)

if __name__ == "__main__":
    main()
