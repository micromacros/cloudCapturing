// https://github.com/atomdeniz/nodejs-mp4-to-hls

const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const fs = require('fs')

    convertMP4 = async function(inputVideoPath, name, callback){
        ffmpeg.setFfmpegPath(ffmpegInstaller.path);
        var videoFile = inputVideoPath;
        // console.log(name)
        var filename = name;
        var HLSfolder = `./encryptAtRest/HLSConverted/${filename}`
        fs.mkdirSync(HLSfolder, { recursive: true });
        
        ffmpeg().input(videoFile)
        .output(`${HLSfolder}/${filename}.m3u8`)
        .addOptions([
            '-profile:v main',
            '-vf scale=w=842:h=480:force_original_aspect_ratio=1,pad=842:480:(ow-iw)/2:(oh-ih)/2',
            '-c:a aac',
            '-ar 48000',
            '-b:a 128k',
            '-c:v h264',
            '-crf 20',
            '-g 48',
            '-keyint_min 48',
            '-sc_threshold 0',
            '-b:v 1400k',
            '-maxrate 1498k',
            '-bufsize 2100k',
            '-hls_time 4',
            `-hls_segment_filename ${HLSfolder}/${filename}_%03d.ts`,
            '-hls_playlist_type vod',
            '-f hls'
        ])
        .on('end', () => {
            var DASHfolder = `./encryptAtRest/DASHConverted/${filename}`
            fs.mkdirSync(DASHfolder, { recursive: true });
            ffmpeg().input(videoFile)
            .output(`${DASHfolder}/${filename}.mpd`)
            .addOptions([
                '-profile:v main',
                '-vf scale=w=842:h=480:force_original_aspect_ratio=1,pad=842:480:(ow-iw)/2:(oh-ih)/2',
                '-preset:v medium',
                '-c:a aac',
                '-ar 48000',
                '-b:a 128k',
                '-c:v libx264',
                '-crf 20',
                '-g 48',
                '-keyint_min 48',
                '-sc_threshold 0',
                '-b:v 1400k',
                '-maxrate 1498k',
                '-bufsize 2100k',
                '-seg_duration 4',
                '-use_template 1',
                `-init_seg_name ${filename}-init-stream$RepresentationID$.mp4`,
                `-media_seg_name ${filename}-chunk-stream$RepresentationID$-$Number%05d$.mp4`,
                '-f dash'
            ])
            .on('end', () => {
                console.log('Conversion complete!');
                callback(null, HLSfolder, DASHfolder);
            })
            .on('error', (err) => {
                console.log(err, null, null)
            })
            .run();    
    
        })
        .run();
    }
    
    



    // function callback() { // do something when encoding is done 
    //     fs.writeFile(`${folder}/${file}.m3u8`, `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360\n${file}360p.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=842x480\n${file}480p.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720\n${file}720p.m3u8`, function (err) {
    //         if (err) {
    //             return console.log(err);
    //         }
    //         console.log("The file was saved!");
    //     })
    // }
    
    
    // ffmpeg().input(videoFile).addOptions([ //360
    //     '-profile:v main',
    //     '-vf scale=w=640:h=360:force_original_aspect_ratio=1,pad=640:360:(ow-iw)/2:(oh-ih)/2',
    //     '-c:a aac',
    //     '-ar 48000',
    //     '-b:a 96k',
    //     '-c:v h264',
    //     '-crf 20',
    //     '-g 48',
    //     '-keyint_min 48',
    //     '-sc_threshold 0',
    //     '-b:v 800k',
    //     '-maxrate 856k',
    //     '-bufsize 1200k',
    //     '-hls_time 10',
    //     `-hls_segment_filename ${folder}/${file}360p_%03d.ts`,
    //     '-hls_playlist_type vod',
    //     '-f hls'
    // ]).output(`${folder}/${file}360p.m3u8`).run()
    
    // ffmpeg().input(videoFile).addOptions([ //480
        // '-profile:v main',
        // '-vf scale=w=842:h=480:force_original_aspect_ratio=1,pad=842:480:(ow-iw)/2:(oh-ih)/2',
        // '-c:a aac',
        // '-ar 48000',
        // '-b:a 128k',
        // '-c:v h264',
        // '-crf 20',
        // '-g 48',
        // '-keyint_min 48',
        // '-sc_threshold 0',
        // '-b:v 1400k',
        // '-maxrate 1498k',
        // '-bufsize 2100k',
        // '-hls_time 10',
        // `-hls_segment_filename ${folder}/${file}480p_%03d.ts`,
        // '-hls_playlist_type vod',
        // '-f hls'
    // ]).output(`${folder}/${file}480p.m3u8`).run()
    
    // ffmpeg().input(videoFile).addOptions([ //720
    //     '-profile:v main',
    //     '-vf scale=w=1280:h=720:force_original_aspect_ratio=1,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
    //     '-c:a aac',
    //     '-ar 48000',
    //     '-b:a 128k',
    //     '-c:v h264',
    //     '-crf 20',
    //     '-g 48',
    //     '-keyint_min 48',
    //     '-sc_threshold 0',
    //     '-b:v 2800k',
    //     '-maxrate 2996k',
    //     '-bufsize 4200k',
    //     '-hls_time 10', 
    //     `-hls_segment_filename ${folder}/${file}720p_%03d.ts`,
    //     '-hls_playlist_type vod',
    //     '-f hls' 
    // ]).output(`${folder}/${file}720p.m3u8`).on('end', callback).run()


module.exports = convertMP4;