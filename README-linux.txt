############
Running
############

If you get an error about libudev.so.0 try this command:

for 32-bit: ln -s /lib/x86-linux-gnu/libudev.so.1.3.5 /usr/lib/libudev.so.0
for 64-bit: ln -s /lib/x86_64-linux-gnu/libudev.so.1.3.5 /usr/lib/libudev.so.0

It is a symlink you can remove at any time.

############
Issues
############

This wallet is designed to run on the newer versions of Ubuntu, it hasn't been tested thoroughly on other distros. Any modern distro that can run chromium should be able to run this.
