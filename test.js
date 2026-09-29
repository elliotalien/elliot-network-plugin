// Node unit tests for Model.js — run with: node test.js
var assert = require("assert")
var M = require("./Model.js")

// parseNetworkStatus
assert.deepStrictEqual(M.parseNetworkStatus("wifi\tHomeNet\t72\t5180"), {
  kind: "wifi", label: "HomeNet", signalStrength: 72, frequency: "5180"
})
assert.strictEqual(M.parseNetworkStatus("").kind, "disconnected")
assert.strictEqual(M.parseNetworkStatus(null).signalStrength, -1)
assert.strictEqual(M.parseNetworkStatus("ethernet\t\t\t").kind, "ethernet")

// wifiIconFor / connectionIcon
assert.strictEqual(M.wifiIconFor(0), "󰤯")
assert.strictEqual(M.wifiIconFor(50), "󰤢")
assert.strictEqual(M.wifiIconFor(100), "󰤨")
assert.strictEqual(M.wifiIconFor(-5), "󰤯")
assert.strictEqual(M.connectionIcon("ethernet", 0), "󰈀")
assert.strictEqual(M.connectionIcon("disconnected", 0), "󰤮")

// formatHeaderSpeed / formatHeaderFreq / headerDetail
assert.strictEqual(M.formatHeaderSpeed("2500"), "2.5gbit")
assert.strictEqual(M.formatHeaderSpeed("1000"), "1gbit")
assert.strictEqual(M.formatHeaderSpeed("100"), "100mbit")
assert.strictEqual(M.formatHeaderSpeed(""), "")
assert.strictEqual(M.formatHeaderFreq("2412"), "2.4ghz")
assert.strictEqual(M.formatHeaderFreq("5180"), "5ghz")
assert.strictEqual(M.formatHeaderFreq("5955"), "6ghz")
assert.strictEqual(M.formatHeaderFreq(""), "")
assert.strictEqual(M.headerDetail({ type: "ethernet", speed: "1000" }), "1gbit")
assert.strictEqual(M.headerDetail({ type: "wifi", freq: "5180" }), "")
assert.strictEqual(M.headerDetail(null), "")

// band helpers
assert.strictEqual(M.bandLabel("auto"), "Auto")
assert.strictEqual(M.bandLabel("5"), "5ghz")
assert.strictEqual(M.bandLabel(""), "")
assert.strictEqual(M.bandSectionTitle("5", "2.4"), "WI-FI BAND")
assert.strictEqual(M.bandSectionTitle("auto", "2.4"), "WI-FI BAND: 2.4GHZ")
assert.strictEqual(M.bandSectionTitle("auto", ""), "WI-FI BAND")
assert.deepStrictEqual(M.parseBandStatus("band\t5\nselected\tauto\navailable\t2.4 5\n"), {
  band: "5", selected: "auto", available: ["2.4", "5"]
})

// decodeIwSsid / parseKeyValue
assert.strictEqual(M.decodeIwSsid("caf\\xc3\\xa9"), "café")
assert.strictEqual(M.decodeIwSsid("plain"), "plain")
assert.strictEqual(M.decodeIwSsid("\\xzz"), "\\xzz") // invalid escape passes through raw
assert.deepStrictEqual(M.parseKeyValue("ssid\tcaf\\xc3\\xa9\nip\t10.0.0.2\n"), {
  ssid: "café", ip: "10.0.0.2"
})
assert.deepStrictEqual(M.parseKeyValue("notabline\nkey\tval\n"), { key: "val" })

// throughputState: first sample seeds only, deltas produce rates, iface
// change reseeds without a fake spike
var seeded = M.throughputState(null, { iface: "wlan0", rx_bytes: "1000", tx_bytes: "500" }, 10)
assert.strictEqual(seeded.downloadRate, 0)
var tick = M.throughputState(seeded, { iface: "wlan0", rx_bytes: "3000", tx_bytes: "900" }, 12)
assert.strictEqual(tick.downloadRate, 1000)
assert.strictEqual(tick.uploadRate, 200)
var reseeded = M.throughputState(tick, { iface: "wlan1", rx_bytes: "50", tx_bytes: "10" }, 14)
assert.strictEqual(reseeded.downloadRate, 0)

// isVpnInterface: tunnels yes, real NICs/bridges/bonds no
;[["wg0", true], ["wg-mullvad", true], ["wgpia0", true], ["tun0", true],
  ["tailscale0", true], ["proton0", true], ["utun3", true],
  ["wlp2s0", false], ["enp3s0", false], ["eth0", false],
  ["br0", false], ["virbr0", false], ["bond0", false],
  ["enp3s0.100", false], ["wwan0", false], ["docker0", false], ["", false]
].forEach(function(c) {
  assert.strictEqual(M.isVpnInterface(c[0]), c[1], "isVpnInterface(" + c[0] + ")")
})

// adapterNames: friendly labels unless they'd collide
assert.deepStrictEqual(M.adapterNames([]), ["Wi-Fi"])
assert.deepStrictEqual(M.adapterNames(["wlp2s0"]), ["Wi-Fi"])
assert.deepStrictEqual(M.adapterNames(["wlp0s20f0u1"]), ["Wi-Fi"])
assert.deepStrictEqual(M.adapterNames(["wlp2s0", "wlp0s20f0u1"]), ["Wi-Fi", "Wi-Fi 2"])
// two PCI radios, or a wlx-named USB dongle, collide -> numbered
assert.deepStrictEqual(M.adapterNames(["wlp2s0", "wlp5s0"]), ["Wi-Fi 1", "Wi-Fi 2"])
assert.deepStrictEqual(M.adapterNames(["wlp2s0", "wlxaabbccddeeff"]), ["Wi-Fi 1", "Wi-Fi 2"])
assert.deepStrictEqual(
  M.adapterNames(["wlp2s0", "wlp0s20f0u1", "wlp0s20f0u2"]),
  ["Wi-Fi 1", "Wi-Fi 2", "Wi-Fi 3"])
assert.deepStrictEqual(
  M.adapterNames(["wlp2s0", "wlp5s0", "wlp0s20f0u1"]),
  ["Wi-Fi 1", "Wi-Fi 2", "Wi-Fi 3"])

// selectConnectedIndex: reopening snaps to the radio carrying the connection
assert.strictEqual(M.selectConnectedIndex([true, false], 1), 0)  // idle selection -> live radio
assert.strictEqual(M.selectConnectedIndex([true, false], 0), 0)  // already on live radio
assert.strictEqual(M.selectConnectedIndex([true, true], 1), 1)   // connected selection is kept
assert.strictEqual(M.selectConnectedIndex([false, true], 0), 1)
assert.strictEqual(M.selectConnectedIndex([false, false], 1), 1) // nothing up -> keep for browsing
assert.strictEqual(M.selectConnectedIndex([], 0), 0)             // no radios
assert.strictEqual(M.selectConnectedIndex([false, false], -1), 0)

// ping helpers
var st = M.pingLatencyState(null, { iface: "wlan0", router_ping_ms: "5", internet_ping_ms: "20" }, 24, 5)
assert.strictEqual(st.routerPingLatency, 5)
assert.strictEqual(st.internetPingLatency, 20)
var st2 = M.pingLatencyState(st, { iface: "wlan0", router_ping_ms: "15", internet_ping_ms: "bad" }, 24, 5)
assert.strictEqual(st2.routerPingLatency, 10)
assert.strictEqual(st2.internetPingLatency, 20) // null sample ignored in average
assert.strictEqual(st2.internetPingPacketLoss, 50)
var st3 = M.pingLatencyState(st2, { iface: "wlan1", router_ping_ms: "3" }, 24, 5)
assert.deepStrictEqual(st3.internetPingSamples, []) // iface change resets history
assert.strictEqual(M.formatPingLatency(-1, true), "Timeout")
assert.strictEqual(M.formatPingLatency(-1, false), "--")
assert.strictEqual(M.formatPingLatency(4.32, true), "4.3 ms")
assert.strictEqual(M.formatPingLatency(20.9, true), "21 ms")
assert.strictEqual(M.formatPacketLoss(0, true), "0%")
assert.strictEqual(M.formatPacketLoss(25, true), "25%")
assert.strictEqual(M.formatPacketLoss(0, false), "--")

// formatBytes / formatRate
assert.strictEqual(M.formatBytes(500), "500 B")
assert.strictEqual(M.formatBytes(2048), "2.0 KB")
assert.strictEqual(M.formatBytes(5 * 1024 * 1024), "5.0 MB")
assert.strictEqual(M.formatBytes(3 * 1024 * 1024 * 1024), "3.00 GB")
assert.strictEqual(M.formatRate(1024), "1.0 KB/s")

// wifiRow / sortWifiRows / wifiSectionTitle
var connected = { connected: true, known: true, name: "A", signalStrength: 0.9, security: "wpa2" }
var known = { connected: false, known: true, name: "B", signalStrength: 0.5, security: "wpa2" }
var open = { connected: false, known: false, name: "C", signalStrength: 0.8, security: "open" }
var rowA = M.wifiRow(connected)
assert.strictEqual(rowA.signal, 90)
assert.strictEqual(M.wifiRow(null), null)
var sorted = M.sortWifiRows([open, known, connected].map(M.wifiRow))
assert.deepStrictEqual(sorted.map(function(r) { return r.ssid }), ["A", "B", "C"])
assert.strictEqual(M.wifiSectionTitle(sorted, 0), "KNOWN NETWORKS")
assert.strictEqual(M.wifiSectionTitle(sorted, 2), "OTHER NETWORKS")
assert.strictEqual(M.wifiSectionTitle(sorted, 1), "")
assert.strictEqual(M.wifiSectionTitle([], 0), "")

// displayConnected: only the radio carrying the default route may show
// "Connected". Two radios associated to the same SSID (PADMALAYAM) both
// report connected=true per-adapter, but the idle one renders as a normal
// known network.
var ifaces = ["wlp2s0", "wlp0s20f0u1"]
// Wi-Fi route: only the owning adapter's rows keep the flag
assert.strictEqual(M.displayConnected(true, "wlp2s0", "wlp2s0", ifaces), true)
assert.strictEqual(M.displayConnected(true, "wlp0s20f0u1", "wlp2s0", ifaces), false)
assert.strictEqual(M.displayConnected(false, "wlp2s0", "wlp2s0", ifaces), false)
// Empty / non-Wi-Fi route: per-adapter flags stand as reported
assert.strictEqual(M.displayConnected(true, "wlp0s20f0u1", "", ifaces), true)
assert.strictEqual(M.displayConnected(true, "wlp0s20f0u1", "enp3s0", ifaces), true)
assert.strictEqual(M.displayConnected(true, "wlp0s20f0u1", "wg0", ifaces), true)
assert.strictEqual(M.displayConnected(true, "wlp0s20f0u1", "wlp2s0", null), true)
assert.strictEqual(M.displayConnected(true, "wlp0s20f0u1", "wlp2s0", []), true)

// End-to-end row pipeline mirroring syncWifiNetworks(): same SSID reported
// connected on both radios, viewed per adapter.
function viewRows(nets, selIface, routeIface, wifiIfaces) {
  var rows = []
  for (var i = 0; i < nets.length; i++) {
    var r = M.wifiRow(nets[i])
    if (r) {
      r.connected = M.displayConnected(r.connected, selIface, routeIface, wifiIfaces)
      rows.push(r)
    }
  }
  return M.sortWifiRows(rows)
}
var padmalayamIdle = { connected: true, known: true, name: "PADMALAYAM", signalStrength: 0.6, security: "wpa2" }
var padmalayamRoute = { connected: true, known: true, name: "PADMALAYAM", signalStrength: 0.9, security: "wpa2" }
var otherKnown = { connected: false, known: true, name: "OTHERNET", signalStrength: 0.8, security: "wpa2" }

// Viewing the idle radio: PADMALAYAM loses its Connected badge and sorts
// with the knowns by signal (OTHERNET 80 > PADMALAYAM 60).
var idleView = viewRows([padmalayamIdle, otherKnown], "wlp0s20f0u1", "wlp2s0", ifaces)
assert.strictEqual(idleView[0].ssid, "OTHERNET")
assert.strictEqual(idleView[1].ssid, "PADMALAYAM")
assert.strictEqual(idleView[1].connected, false)
assert.strictEqual(M.wifiSectionTitle(idleView, 0), "KNOWN NETWORKS")
assert.strictEqual(M.wifiSectionTitle(idleView, 1), "")
// The demoted row is a normal known network: forgettable, click connects.
assert.strictEqual(M.canForgetNetwork(idleView[1]), true)

// Viewing the route-owning radio: Connected badge survives and pins the row
// to the top despite the weaker-signal known network.
var routeView = viewRows([otherKnown, padmalayamRoute], "wlp2s0", "wlp2s0", ifaces)
assert.strictEqual(routeView[0].ssid, "PADMALAYAM")
assert.strictEqual(routeView[0].connected, true)
assert.strictEqual(M.canForgetNetwork(routeView[0]), false)
assert.strictEqual(M.wifiSectionTitle(routeView, 0), "KNOWN NETWORKS")

// Ethernet/VPN route: the idle radio's own Connected badge still shows.
var ethView = viewRows([padmalayamIdle, otherKnown], "wlp0s20f0u1", "enp3s0", ifaces)
assert.strictEqual(ethView[0].ssid, "PADMALAYAM")
assert.strictEqual(ethView[0].connected, true)
var vpnView = viewRows([padmalayamIdle, otherKnown], "wlp0s20f0u1", "wg-mullvad", ifaces)
assert.strictEqual(vpnView[0].connected, true)
var noRouteView = viewRows([padmalayamIdle, otherKnown], "wlp0s20f0u1", "", ifaces)
assert.strictEqual(noRouteView[0].connected, true)

// credentials / forget
assert.strictEqual(M.requiresCredentials("wpa2", "open", "owe"), true)
assert.strictEqual(M.requiresCredentials("open", "open", "owe"), false)
assert.strictEqual(M.requiresCredentials("owe", "open", "owe"), false)
assert.strictEqual(M.canForgetNetwork({ known: true, connected: false }), true)
assert.strictEqual(M.canForgetNetwork({ known: true, connected: true }), false)
assert.strictEqual(M.canForgetNetwork(null), false)

// failure reasons
var R = { NoSecrets: 1, WifiAuthTimeout: 2, WifiNetworkLost: 3, WifiClientDisconnected: 4, WifiClientFailed: 5 }
assert.strictEqual(M.networkFailureReason(R.NoSecrets, true, R), "Passphrase required")
assert.strictEqual(M.networkFailureReason(R.WifiAuthTimeout, true, R), "Wrong password")
assert.strictEqual(M.networkFailureReason(R.WifiAuthTimeout, false, R), "Failed to connect")
assert.strictEqual(M.networkFailureReason(R.WifiNetworkLost, false, R), "Network lost")
assert.strictEqual(M.shouldRepromptPassphrase(R.NoSecrets, true, R), true)
assert.strictEqual(M.shouldRepromptPassphrase(R.WifiAuthTimeout, true, R), true)
assert.strictEqual(M.shouldRepromptPassphrase(R.NoSecrets, false, R), false)
assert.strictEqual(M.shouldRepromptPassphrase(R.WifiClientFailed, true, R), false)

// enterpriseConnectScript never takes the secret via argv
assert.ok(M.enterpriseConnectScript.indexOf("read -r pw") !== -1)
assert.ok(M.enterpriseConnectScript.indexOf("802-1x.password") !== -1)

console.log("All tests passed")
